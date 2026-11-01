import sys, os, json, socket, base64, struct, subprocess, time, urllib.request, tempfile
# usage: dev/pageshot.py OUTDIR MODE 'SEL@P' 'js:EXPR' ...  — real page with app.js, scrolled via CDP. MODE d|m
OUT, MODE, SHOTS = sys.argv[1], sys.argv[2], sys.argv[3:]
W, H, DPR = {'d': (1440, 900, 1), 'm': (390, 844, 2)}[MODE]
os.makedirs(OUT, exist_ok=True)
port = 9300 + os.getpid() % 500
ud = tempfile.mkdtemp()
ch = subprocess.Popen(['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '--headless=new', '--hide-scrollbars', '--autoplay-policy=no-user-gesture-required',
  f'--remote-debugging-port={port}', f'--user-data-dir={ud}', '--window-size=1440,900', 'about:blank'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
for _ in range(100):
    try:
        tl = json.load(urllib.request.urlopen(f'http://127.0.0.1:{port}/json/list')); break
    except Exception: time.sleep(.1)
ws_url = [t for t in tl if t['type'] == 'page'][0]['webSocketDebuggerUrl']
host, path = ws_url[5:].split('/', 1)
s = socket.create_connection((host.split(':')[0], int(host.split(':')[1])))
key = base64.b64encode(os.urandom(16)).decode()
s.send(f'GET /{path} HTTP/1.1\r\nHost: {host}\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: {key}\r\nSec-WebSocket-Version: 13\r\n\r\n'.encode())
buf = b''
while b'\r\n\r\n' not in buf: buf += s.recv(4096)
buf = buf.split(b'\r\n\r\n', 1)[1]
def recvn(n):
    global buf
    while len(buf) < n:
        d = s.recv(1 << 20)
        if not d: raise EOFError
        buf += d
    r, buf = buf[:n], buf[n:]; return r
def recv_msg():
    data = b''
    while True:
        b0, b1 = recvn(2); ln = b1 & 127
        if ln == 126: ln = struct.unpack('>H', recvn(2))[0]
        elif ln == 127: ln = struct.unpack('>Q', recvn(8))[0]
        data += recvn(ln)
        if b0 & 0x80: return data
mid = 0
def send(method, **params):
    global mid
    mid += 1
    payload = json.dumps({'id': mid, 'method': method, 'params': params}).encode()
    hdr = bytes([0x81]); n = len(payload); mask = os.urandom(4)
    hdr += bytes([0x80 | n]) if n < 126 else (bytes([0x80 | 126]) + struct.pack('>H', n) if n < 65536 else bytes([0x80 | 127]) + struct.pack('>Q', n))
    s.send(hdr + mask + bytes(b ^ mask[i % 4] for i, b in enumerate(payload)))
    while True:
        m = json.loads(recv_msg())
        if m.get('method') == 'Runtime.consoleAPICalled':
            print('console:', ' '.join(str(a.get('value', a.get('description', ''))) for a in m['params']['args']))
        if m.get('method') == 'Runtime.exceptionThrown':
            print('EXC:', m['params']['exceptionDetails'].get('exception', {}).get('description', m['params']['exceptionDetails']))
        if m.get('id') == mid: return m.get('result', m.get('error'))

send('Runtime.enable'); send('Page.enable')
send('Emulation.setDeviceMetricsOverride', width=W, height=H, deviceScaleFactor=DPR, mobile=MODE == 'm')
send('Page.navigate', url='http://127.0.0.1:8091/index.html')
time.sleep(4)
for i, sh in enumerate(SHOTS):
    if sh.startswith('js:'):  # 'js:EXPR' evaluates EXPR in the page and prints its value
        print(i, send('Runtime.evaluate', expression=sh[3:], awaitPromise=True, returnByValue=True).get('result', {}).get('value')); time.sleep(.8); continue
    if sh == 'shot':  # 'shot' captures the screen as it is, no scrolling
        r = send('Page.captureScreenshot', format='png'); open(os.path.join(OUT, f'{i:02d}.png'), 'wb').write(base64.b64decode(r['data'])); print(i, sh); continue
    sel, pp = sh.rsplit('@', 1)
    js = f"""(() => {{ const t = document.querySelector({json.dumps(sel)}); let top = 0; for (let n = t; n; n = n.offsetParent) top += n.offsetTop;
      const pin = t.classList.contains('scene'); const y = pin ? top + {pp} * Math.max(0, t.offsetHeight - innerHeight) : top + {pp} * t.offsetHeight; scrollTo(0, y); return y; }})()"""
    send('Runtime.evaluate', expression=js)
    time.sleep(1.6)
    r = send('Page.captureScreenshot', format='png')
    open(os.path.join(OUT, f'{i:02d}.png'), 'wb').write(base64.b64decode(r['data']))
    print(i, sh)
ch.kill()
