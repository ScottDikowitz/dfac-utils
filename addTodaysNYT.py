from urllib import request
import json
import html
import calendar

BASE_URL = 'http://localhost:3021'
DATE = ""
def fetch_puzzle(date="current"):
    # 'https://www.xwordinfo.com/JSON/Data.ashx?date=2/12/2025'
    headers = {
        "Referer":"https://www.xwordinfo.com/",
    }
    request_params = request.Request(
        url="https://www.xwordinfo.com/JSON/Data.ashx?date={}".format(date), 
        headers=headers
    )
    req = request.urlopen(request_params).read()
    return json.loads(req)

def request_pid():
    PID_URL = '{}/api/counters/pid'.format(BASE_URL)
    req =  request.Request(PID_URL, method='POST')
    resp = request.urlopen(req).read()
    pidresp = json.loads(resp)
    return pidresp['pid']

def xword_to_dfac(obj):
    grid = []
    circles = []
    shades = [] # TODO
    row_size = obj.get('size').get('rows')
    col_size = obj.get('size').get('cols')
    for i in range(0, row_size):
        row = []
        grid.append(row)
        for j in range(0, col_size):
            row.append(obj.get('grid')[(i*col_size)+j])
            if obj.get('circles') and obj.get('circles')[(i*col_size)+j]:
                circles.append(i*col_size + j)
    game_type = 'Daily Puzzle' if len(grid) > 10 else 'Mini Puzzle'
    title = obj.get('title', '')
    if 'Times' not in title:
        mon,day,yr = obj.get('date').split('/')
        title = '{} NY Times, {}, {} {}, {}'.format(title, obj.get('dow', ''), calendar.month_name[int(mon)], day, yr)
    author = obj.get('author', '')
    if obj.get('editor'):
        author = author + ' / {}'.format(obj['editor'])
    description = obj.get('description', '')

    def parseClueNum(clue):
        buf = ''
        for i in range(0, len(clue)):
            if clue[i] == '.':
                break
            buf += clue[i]
        return int(buf)

    across_size = parseClueNum(obj.get('clues').get('across')[-1])
    down_size = parseClueNum(obj.get('clues').get('down')[-1])

    clues = {
        "across": [None] * (across_size + 1),
        "down": [None] * (down_size + 1)
    }

    for direction in ['across', 'down']:
        for clue in obj.get('clues').get(direction):
            idx = parseClueNum(clue)
            offset = len(str(idx))+2
            clues[direction][idx] = html.unescape(clue[offset:])

    return {
      "grid": grid,
      "circles": circles,
      "shades": shades,
      "info": {
        "type": game_type,
        "title": title,
        "author": author,
        "description": description,
      },
      "clues": clues
    }

def post_puzzle(puzzle, pid, is_public=True):
    PUZZLE_URL = '{}/api/puzzle'.format(BASE_URL)
    data = {
        'puzzle': puzzle,
        'pid': pid,
        'isPublic': is_public,
    }
    req = request.Request(PUZZLE_URL, data=json.dumps(data).encode(), method='POST')
    req.add_header('Content-Type', 'application/json')
    resp = request.urlopen(req).read()
    return json.loads(resp)

def main():
    xword_puzzle = fetch_puzzle(DATE)
    pid = request_pid()
    dfac_puzzle = xword_to_dfac(xword_puzzle)
    print(post_puzzle(dfac_puzzle, pid, True))

if __name__ == '__main__':
    main()