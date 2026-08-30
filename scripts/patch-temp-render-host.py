from pathlib import Path

path = Path('Garbaty Panel.user.js')
s = path.read_text(encoding='utf-8')

old_host = 'https://garbaty-panel-api.onrender.com'
new_host = 'https://garbaty-panel-api-rw39.onrender.com'

if old_host not in s:
    raise SystemExit('old Render host not found')

s = s.replace(old_host, new_host)
s = s.replace('// @version      6.10.2', '// @version      6.10.3', 1)
s = s.replace("_0x414d65='6.10.2'", "_0x414d65='6.10.3'", 1)

path.write_text(s, encoding='utf-8')
