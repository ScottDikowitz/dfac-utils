import { JsonResponse, DFACpuzzle } from './interfaces';

const BASE_URL = 'http://localhost:3021';

async function getData(): Promise<JsonResponse> {
  let response = await fetch('https://www.xwordinfo.com/JSON/Data.ashx?date=2/12/2025', {
    headers: {
      Referer: 'https://www.xwordinfo.com'
    }
  });
  let data: JsonResponse = await response.json();
  return data;
}

async function fetchPid(): Promise<string> {
  let response = await fetch(`${BASE_URL}/api/counters/pid`, {
    method: "POST"
  });
  let data: { pid: string } = await response.json();
  return data.pid;
}
async function postPuzzle(puzzle: any, pid: string, isPublic: boolean): Promise<void> {
  await fetch(`${BASE_URL}/api/puzzle`, {
    method: "POST",
    body: JSON.stringify({ puzzle: puzzle, pid, isPublic })
  });
}

function convertToDFAC(json: JsonResponse) {
    const grid: number[][] = [];
    const circles: number[] = [];
    const shades: number[] = [];
    for(let i = 0; i < json.size.rows; i++) {
      const row: number[] = [];
      grid.push(row);
      for(let j = 0; j < json.size.cols; j++) {
        row.push(
          json.grid[(i*json.size.cols)+j]
        );
        if (json.circles && json.circles[(i*json.size.cols)+j]) {
          circles.push(i * json.size.cols + j);
        }
      }
    }
    const type = grid.length > 10 ? 'Daily Puzzle' : 'Mini Puzzle';
    const title = json.title || '';
    let author = json.author || '';
    if (json.editor) author += ` / ${json.editor}`;
    const description = json.description || '';
    function parseClueNum(clue: string) {
      let buf = '';
      for(let i = 0; i < clue.length && clue[i] !== '.'; i++) {
        buf+= clue[i];
      }
      return parseInt(buf);
    }
    var decodeHtmlEntity = function(str: string) {
      str = str.replaceAll('&quot;', '"');
      return str.replace(/&#(\d+);/g, function(match, dec) {
        return String.fromCharCode(dec);
      });
    };
    const acrossSize = parseClueNum(json.clues.across[json.clues.across.length-1]);
    const downSize = parseClueNum(json.clues.down[json.clues.down.length-1]);
    const across = new Array(acrossSize);
    const down = new Array(downSize);
    for(let clue of json.clues.across) {
      const idx = parseClueNum(clue);
      const offset = String(idx).length+2;
      across[idx] = decodeHtmlEntity(clue.slice(offset));
    }
    for(let clue of json.clues.down) {
      const idx = parseClueNum(clue);
      const offset = String(idx).length+2;
      down[idx] = decodeHtmlEntity(clue.slice(offset));
    }

    const result: DFACpuzzle = {
      grid,
      circles,
      shades,
      info: {
        type,
        title,
        author,
        description,
      },
      clues: {across, down},
    };
    return result;
  }

  async function main() {
    const data = await getData();
    const converted = convertToDFAC(data);
    const pid = await fetchPid();
    postPuzzle(converted, pid, true);
  }

main();