import { Enum, toUpperFirstLetter } from "./general";

const TetriminoUnion = ['i','o','s','z','j','l','t','empty','wall'] as const;
export type Tetrimino = typeof TetriminoUnion[number];

export const TetriminoEnum:Enum<Tetrimino> = {
	defArray: TetriminoUnion,
	toEnum: (arg: any)=> {return arg as Tetrimino},
	toString: (arg: Tetrimino) => {return arg as string},
	getTitle: (arg: Tetrimino) => {return toUpperFirstLetter(arg as string)},
}

export type Pos = {
	x: number,
	y: number,
}

export type Mino = {
	x: number,
	y: number,
	mino: Tetrimino,
}

export const normalMatrixHeight: number = 20;
export const normalMatrixWidth: number = 10;

export const normalBufferHeight: number = 2;
export const normalBufferWidth:number = normalMatrixWidth;

export const normalFieldHeight: number = normalMatrixHeight + normalBufferHeight;
export const normalFieldWidth:number = normalMatrixWidth;

export function getMirrorField(field: readonly Tetrimino[][]) {
	let mirrorArray = [] as Tetrimino[][];

	for (const line of field) {
		mirrorArray.push(line.reverse())
	}

	return mirrorArray;
}

export function getMirrorFieldAtRnd(field: Tetrimino[][]): Tetrimino[][] {
	const rnd = Math.floor(Math.random() * 2);

	if (rnd == 0) {
		return field;
	} else {
		return getMirrorField(field);
	}
}
