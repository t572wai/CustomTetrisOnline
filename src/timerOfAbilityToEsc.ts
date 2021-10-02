export class TimerOfAbilityToEsc {
	private timer: NodeJS.Timer;
	private endCb: ()=>void;
	private waitSec: number;
	private startTime: number;
	private processTime: number;

	constructor(callback: ()=>void = ()=>{},sec: number = 1000) {
		this.waitSec = sec;
		this.endCb = callback;
		this.processTime = 0;
	}

	setTimeout(): void {
		this.processTime = 0;
		this.timer = setTimeout(this.endCb, this.waitSec);
		this.startTime = Date.now();
	}
	clearTimeout(): void {
		clearTimeout(this.timer);
		this.processTime = 0;
	}

	pauseTimeout() {
		this.processTime += Date.now() - this.startTime;
		if (this.processTime < this.waitSec) {
			clearTimeout(this.timer);
		}
	}
	restartTimeout() {
		this.startTime = Date.now();
		this.timer = setTimeout(this.endCb,this.waitSec-this.processTime);
	}
}
