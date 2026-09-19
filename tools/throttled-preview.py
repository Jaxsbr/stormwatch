"""Controlled local HTTP profile: aggregate 10 Mbps body bandwidth, 100 ms request delay.
Usage: python3 tools/throttled-preview.py [dist-directory] [port]
This models application-level delivery, not physical mobile radio/TCP conditions.
"""
import http.server
import json
import os
import sys
import threading
import time

RATE = 10_000_000 / 8
lock = threading.Lock()
next_slot = 0.0

class ProfiledHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        self.sent_body = 0
        self.sent_headers = 0
        time.sleep(0.100)
        super().do_GET()
        print(json.dumps({'path': self.path, 'bodyBytes': self.sent_body, 'headerBytes': self.sent_headers}), flush=True)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        self.sent_headers = sum(len(line) for line in self._headers_buffer) + 2
        super().end_headers()

    def copyfile(self, source, outputfile):
        global next_slot
        try:
            while chunk := source.read(16_384):
                with lock:
                    now = time.monotonic()
                    start = max(now, next_slot)
                    next_slot = start + len(chunk) / RATE
                    deadline = next_slot
                time.sleep(max(0, deadline - time.monotonic()))
                outputfile.write(chunk)
                outputfile.flush()
                self.sent_body += len(chunk)
        except (BrokenPipeError, ConnectionResetError):
            pass

if __name__ == '__main__':
    directory = sys.argv[1] if len(sys.argv) > 1 else 'dist'
    port = int(sys.argv[2]) if len(sys.argv) > 2 else 4176
    os.chdir(directory)
    server = http.server.ThreadingHTTPServer(('127.0.0.1', port), ProfiledHandler)
    print(f'Profiled preview: http://127.0.0.1:{port}/?measure=1', flush=True)
    server.serve_forever()
