/**
 * AI 제작반 부스 - AI 중계 서버 (Google Apps Script 웹 앱)
 *
 * 크롬북 → 이 웹 앱 → SNU AI Chat(factchat) API
 * API 키는 이 스크립트의 '스크립트 속성'에만 저장됨 (페이지·레포에는 없음)
 * 설정은 연결된 스프레드시트 상단 메뉴 [🤖 AI 설정]에서 함
 */

const BASE_URL = 'https://factchat.mindlogic-kr-api.com/v1/gateway';
const MAX_IMAGE_CHARS = 600000;   // data URL 길이 제한 (약 450KB)
const PER_MINUTE_LIMIT = 60;      // 1분에 전체 요청 수 제한 (토큰 아끼기)
const CHEAP_HINTS = ['nano', 'mini', 'flash-lite', 'lite', 'haiku', 'flash', 'small'];

const props = () => PropertiesService.getScriptProperties();

// ---------- 스프레드시트 메뉴 ----------
function onOpen() {
  SpreadsheetApp.getUi().createMenu('🤖 AI 설정')
    .addItem('🔑 API 키 입력', 'showKeyDialog')
    .addItem('🧠 모델 선택', 'showModelDialog')
    .addItem('✅ 사진으로 연결 테스트', 'testConnection')
    .addSeparator()
    .addItem('⏯️ AI 켜기 / 끄기', 'toggleEnabled')
    .addItem('🔄 상태 새로고침', 'refreshStatus')
    .addToUi();
  refreshStatus();
}

function showKeyDialog() {
  const html = HtmlService.createHtmlOutput(`
    <div style="font-family:sans-serif;padding:4px">
      <p style="margin:0 0 8px">SNU AI Chat API 키를 붙여넣으세요.<br><small>이 스크립트 안에만 저장되고 화면에는 보이지 않아요.</small></p>
      <input id="k" type="password" style="width:100%;padding:8px;font-size:14px" autocomplete="off">
      <div style="margin-top:12px;text-align:right">
        <button onclick="google.script.host.close()">취소</button>
        <button id="b" onclick="save()" style="background:#1a73e8;color:#fff;border:0;padding:8px 16px;border-radius:4px">저장</button>
      </div>
      <p id="m" style="color:#c00"></p>
    </div>
    <script>
      function save(){
        var v=document.getElementById('k').value.trim();
        if(!v){document.getElementById('m').textContent='키를 입력해 주세요.';return;}
        document.getElementById('b').disabled=true;
        google.script.run.withSuccessHandler(function(){google.script.host.close();})
          .withFailureHandler(function(e){document.getElementById('m').textContent=e.message;document.getElementById('b').disabled=false;})
          .saveKey(v);
      }
    </script>`).setWidth(420).setHeight(200);
  SpreadsheetApp.getUi().showModalDialog(html, '🔑 API 키 입력');
}

function saveKey(key) {
  props().setProperty('API_KEY', String(key).trim());
  refreshStatus();
}

function listModels_() {
  const key = props().getProperty('API_KEY');
  if (!key) throw new Error('먼저 [🔑 API 키 입력]을 해주세요.');
  const res = UrlFetchApp.fetch(BASE_URL + '/models', { headers: { Authorization: 'Bearer ' + key }, muteHttpExceptions: true });
  if (res.getResponseCode() !== 200) throw new Error('모델 목록을 못 받았어요 (' + res.getResponseCode() + '): ' + res.getContentText().slice(0, 200));
  const body = JSON.parse(res.getContentText());
  const ids = (body.data || body.models || []).map(m => typeof m === 'string' ? m : m.id).filter(Boolean);
  const rank = id => { const i = CHEAP_HINTS.findIndex(h => id.toLowerCase().includes(h)); return i < 0 ? 99 : i; };
  return ids.sort((a, b) => rank(a) - rank(b) || a.localeCompare(b)).map(id => ({ id, cheap: rank(id) < 99 }));
}

function showModelDialog() {
  let models;
  try { models = listModels_(); } catch (e) { SpreadsheetApp.getUi().alert(e.message); return; }
  const current = props().getProperty('MODEL') || '';
  const options = models.map(m => `<option value="${m.id}" ${m.id === current ? 'selected' : ''}>${m.cheap ? '💰 ' : ''}${m.id}</option>`).join('');
  const html = HtmlService.createHtmlOutput(`
    <div style="font-family:sans-serif;padding:4px">
      <p style="margin:0 0 8px">사진을 이해하는 모델을 골라주세요.<br><small>💰 = 가볍고 저렴한 계열 (위쪽일수록 저렴한 편). 고른 뒤 [✅ 사진으로 연결 테스트]로 꼭 확인!</small></p>
      <select id="s" size="12" style="width:100%;font-size:13px">${options}</select>
      <div style="margin-top:12px;text-align:right">
        <button onclick="google.script.host.close()">취소</button>
        <button onclick="google.script.run.withSuccessHandler(function(){google.script.host.close()}).saveModel(document.getElementById('s').value)" style="background:#1a73e8;color:#fff;border:0;padding:8px 16px;border-radius:4px">이 모델 쓰기</button>
      </div>
    </div>`).setWidth(460).setHeight(380);
  SpreadsheetApp.getUi().showModalDialog(html, '🧠 모델 선택 (' + models.length + '개)');
}

function saveModel(model) {
  if (!model) throw new Error('모델을 골라주세요.');
  props().setProperty('MODEL', model);
  refreshStatus();
}

function toggleEnabled() {
  const off = props().getProperty('DISABLED') === '1';
  props().setProperty('DISABLED', off ? '0' : '1');
  refreshStatus();
  SpreadsheetApp.getUi().alert(off ? '✅ AI를 켰어요.' : '⏸️ AI를 껐어요. 크롬북에서는 기본 박스 인식만 동작해요.');
}

// 실제 사진(구글 로고 아님, 테스트용 바나나 사진)으로 한 번 물어보기
function testConnection() {
  const ui = SpreadsheetApp.getUi();
  try {
    const img = UrlFetchApp.fetch('https://getbetterwithu.github.io/ai-club-booth/quiz/img/2a362a2ff7.jpg').getBlob();
    const dataUrl = 'data:image/jpeg;base64,' + Utilities.base64Encode(img.getBytes());
    const t = Date.now();
    const r = askVision_(dataUrl, '');
    ui.alert('✅ 연결 성공 (' + ((Date.now() - t) / 1000).toFixed(1) + '초)\n\n모델: ' + props().getProperty('MODEL') +
      '\n답: ' + r.emoji + ' ' + r.name + ' (' + r.confidence + '%)\n' + r.comment + '\n\n바나나라고 답했으면 이 모델로 OK!');
  } catch (e) {
    ui.alert('❌ 실패\n\n' + e.message);
  }
}

function refreshStatus() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) return;
  const sh = ss.getSheetByName('설정') || ss.insertSheet('설정', 0);
  const p = props();
  const key = p.getProperty('API_KEY');
  let url = '';
  try { url = ScriptApp.getService().getUrl() || ''; } catch (e) {}
  sh.clear();
  sh.getRange(1, 1, 7, 2).setValues([
    ['🤖 AI 제작반 부스 - AI 설정', ''],
    ['', ''],
    ['API 키', key ? '등록됨 (…' + key.slice(-4) + ')' : '❌ 없음 → 메뉴 [🤖 AI 설정] → [🔑 API 키 입력]'],
    ['모델', p.getProperty('MODEL') || '❌ 없음 → 메뉴 [🧠 모델 선택]'],
    ['상태', p.getProperty('DISABLED') === '1' ? '⏸️ 꺼짐' : '✅ 켜짐'],
    ['웹 앱 주소', url],
    ['안내', '상단 메뉴 [🤖 AI 설정]에서 키 입력 → 모델 선택 → 사진으로 연결 테스트 순서로 하면 끝!'],
  ]);
  sh.getRange('A1').setFontSize(14).setFontWeight('bold');
  sh.getRange('A3:A7').setFontWeight('bold');
  sh.setColumnWidth(1, 120); sh.setColumnWidth(2, 640);
}

// ---------- 웹 앱 (크롬북이 호출) ----------
function doGet() {
  const p = props();
  return json_({ ready: !!(p.getProperty('API_KEY') && p.getProperty('MODEL')) && p.getProperty('DISABLED') !== '1' });
}

function doPost(e) {
  try {
    const p = props();
    if (p.getProperty('DISABLED') === '1') return json_({ error: 'AI가 잠시 쉬는 중이야' });
    if (!rateOk_()) return json_({ error: '사람이 몰려서 잠깐 쉬는 중이야. 몇 초 뒤에 다시 눌러줘!' });
    const body = JSON.parse(e.postData.contents || '{}');
    const image = String(body.image || '');
    if (!/^data:image\/(jpeg|png|webp);base64,/.test(image) || image.length > MAX_IMAGE_CHARS) return json_({ error: '사진이 올바르지 않아' });
    const target = String(body.target || '').slice(0, 20);
    return json_(askVision_(image, target));
  } catch (err) {
    return json_({ error: String(err.message || err).slice(0, 200) });
  }
}

function askVision_(image, target) {
  const p = props();
  const key = p.getProperty('API_KEY'), model = p.getProperty('MODEL');
  if (!key || !model) throw new Error('AI 설정이 아직 안 됐어 (키·모델)');
  const system =
    '너는 중학교 축제 "AI 물건 맞추기" 부스의 AI야. 사진에서 사람이 카메라에 보여주는 물건을 맞혀. ' +
    '사람 얼굴이나 몸 말고 물건에 집중해. 물건이 여러 개면 가장 크게·가운데 보이는 것 하나. ' +
    '반드시 JSON 하나만 출력하고 다른 말은 쓰지 마: ' +
    '{"name":"물건 이름(한국어, 2~8글자)","emoji":"어울리는 이모지 1개","confidence":0~100 정수,' +
    '"comment":"중학생 친구에게 말하듯 재치 있는 한 줄, 반말, 35자 이내","match":true 또는 false}. ' +
    'match는 미션 목표가 주어졌을 때 그 물건이 목표에 해당하면 true, 아니면 false. ' +
    '물건이 안 보이면 name을 "잘 모르겠어", confidence 0.';
  // GPT-5 계열 같은 '생각하는' 모델은 temperature를 못 바꾸고, 생각에도 토큰을 써서 넉넉히 줌
  const reasoning = /gpt-5|o\d|reason/i.test(model);
  const payload = reasoning
    ? { model: model, max_completion_tokens: 1500, reasoning_effort: 'minimal' }
    : { model: model, temperature: 0.3, max_tokens: 200 };
  payload.messages = [
      { role: 'system', content: system },
      { role: 'user', content: [
        { type: 'text', text: target ? '미션 목표: ' + target : '미션 목표: 없음' },
        { type: 'image_url', image_url: { url: image } }
      ] }
  ];
  const call = body => UrlFetchApp.fetch(BASE_URL + '/chat/completions', {
    method: 'post', contentType: 'application/json', muteHttpExceptions: true,
    headers: { Authorization: 'Bearer ' + key }, payload: JSON.stringify(body)
  });
  let res = call(payload);
  // 게이트웨이가 옵션을 거부하면 기본 옵션만으로 한 번 더
  if (res.getResponseCode() === 400) res = call({ model: model, messages: payload.messages });
  const code = res.getResponseCode(), text = res.getContentText();
  if (code === 401 || code === 403) throw new Error('API 키를 확인해 주세요 (' + code + ')');
  if (code !== 200) throw new Error('AI 서버 오류 ' + code + ': ' + text.slice(0, 150));
  const content = ((JSON.parse(text).choices || [])[0] || {}).message?.content || '';
  const m = String(content).match(/\{[\s\S]*\}/);
  let r = {};
  try { r = m ? JSON.parse(m[0]) : {}; } catch (e) {}
  return {
    name: String(r.name || '잘 모르겠어').slice(0, 20),
    emoji: String(r.emoji || '🤔').slice(0, 4),
    confidence: Math.max(0, Math.min(100, parseInt(r.confidence, 10) || 0)),
    comment: String(r.comment || '').slice(0, 60),
    match: r.match === true
  };
}

function rateOk_() {
  const cache = CacheService.getScriptCache();
  const k = 'rl:' + Math.floor(Date.now() / 60000);
  const lock = LockService.getScriptLock();
  try { lock.waitLock(3000); } catch (e) { return true; }
  try {
    const n = parseInt(cache.get(k) || '0', 10) + 1;
    cache.put(k, String(n), 120);
    return n <= PER_MINUTE_LIMIT;
  } finally { lock.releaseLock(); }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
