interface SizeResponse {
    rows: number;
    cols: number;
}

interface CluesResponse {
    down: string[];
    across: string[];
}

export interface JsonResponse {
    size: SizeResponse;
    grid: number[];
    circles: number[];
    title: string;
    author: string;
    editor: string;
    description?: string;
    clues: CluesResponse;
}
export interface DFACpuzzle {
    grid: number[][];
    circles: number[];
    shades: number[];
    info: {
        type: string,
        title: string,
        author: string,
        description: string,
    },
    clues: {
        across: string[],
        down: string[],
    }
}