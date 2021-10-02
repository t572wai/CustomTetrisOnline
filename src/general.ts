//import * as deepEqual from "deep-equal";

//import { deepEqual } from "assert";

export function cloneArray<T>(array: readonly T[]): T[] {
	console.log(array);
	return [...array];
}

export function shuffle<T>(arrayTemp: readonly T[]): T[] {
	let array = cloneArray<T>(arrayTemp)
	for(var i = array.length - 1; i > 0; i--){
			var r = Math.floor(Math.random() * (i + 1));
			var tmp = array[i];
			array[i] = array[r];
			array[r] = tmp;
	}
	return array;
}

//const resetLogColor = '\u001b[0m';

//const redLog = '\u001b[31m';
//const greenLog = '\u001b[32m';

const aryMax = function (a: number, b: number): number {return Math.max(a,b);}
const aryMin = function (a: number, b: number): number {return Math.min(a,b);}
export function maxArray(array: readonly number[]): number {
	return array.reduce(aryMax);
}
export function minArray(array: readonly number[]): number {
	return array.reduce(aryMin);
}

export function arrayEquals<T>(array1: readonly T[],array2: readonly T[]): boolean {
	return JSON.stringify(array1) == JSON.stringify(array2);
}

export function equal<T>(item1: T, item2: T): boolean {
	return JSON.stringify(item1) == JSON.stringify(item2);
}

export function includesArray<T>(array: readonly T[], elem: T): boolean {
	if (array.find((item) => equal<T>(item,elem))) {
		return true;
	} else {
		return false;
	}
}

export function toUpperFirstLetter(str: string): string {
  return str.charAt(0).toUpperCase() + str.substring(1);
}

export function toLowerFirstLetter(str: string): string {
  return str.charAt(0).toLowerCase() + str.substring(1);
}

export interface Enum<T> {
	readonly defArray: readonly T[],
	toEnum: (arg: any)=>T|undefined,
	toString: (arg: T)=>string,
	getTitle: (arg: T)=>string
}

export function setCssVar(name: string, value: string): void {
	document.documentElement.style.setProperty(name, value);
}

export interface CssProperty {
	[property: string]: string,
}
