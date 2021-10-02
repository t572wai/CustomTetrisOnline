export class Swiper {
	target: JQuery;
	dist: number;
	waitSec: number;
	intervalSec: number;
	isSwiping: boolean;
	onTouchstartAction: (e: any) => void;
	onTouchmoveAction: (e: any) => void;
	onTouchendAction: (e: any) => void;
	currentDeltaX: number;
	currentDeltaY: number;
	currentDeltaT: number;
	startX: any;
	startY: any;
	startT: number;
	moveX: any;
	moveY: any;
	moveT: number;
	currentDirection: string;
	timer: any;
	currentVelocity2: number;
	intervalTimer: any;

	constructor( obj: any, dist: number = 30, sec: number = 0, intervalSec: number = 0 ) {
		this.target = $(obj);
		this.dist = dist;
		this.waitSec = sec;
		this.intervalSec = intervalSec;

		this.isSwiping = false;

		this.onTouchstartAction = function (e) {
				e.preventDefault();
				this.startX = e.touches[0].pageX;
				this.startY = e.touches[0].pageY;
				this.startT = Date.now()
				this.moveX = this.startX;
				this.moveY = this.startY;
				this.moveT = this.startT;

				this.isSwiping = false;
			}

		this.onTouchmoveAction = function (e) {
					e.preventDefault();

					const formerDirection = this.getDirection()

					this.moveX = e.touches[0].pageX;
					this.moveY = e.touches[0].pageY;
					this.moveT = Date.now();

					this.currentDeltaX = this.moveX - this.startX;
					this.currentDeltaY = this.moveY - this.startY;
					this.currentDeltaT = this.moveT - this.startT;
					// console.log(this.currentDeltaX,this.currentDeltaY,this.currentDeltaT);

					if (this.getDistance2() > this.dist**2) {
						this.isSwiping = true;
						this.currentDirection = this.getDirection()
						this.currentVelocity2 = this.getVelocity2()
						this.target.trigger('swipedist',[this.currentDirection, this.currentVelocity2])
						this.startX = this.moveX;
						this.startY = this.moveY;
						this.startT = this.moveT;
						console.log(this.getVelocity2());
					}

					if (this.isSwiping && this.currentDirection != formerDirection) {
						clearTimeout(this.timer)
						clearInterval(this.intervalTimer)
						console.log("%c"+this.currentDirection+","+formerDirection,'color:pink');
						this.target.trigger('swipestart',[this.currentDirection, this.currentVelocity2])
						this.timer = setTimeout( () => {
							this.target.trigger('longswipe',[this.currentDirection, this.currentVelocity2])
							this.intervalTimer = setInterval( () => {
								this.target.trigger('longswipe',[this.currentDirection, this.currentVelocity2])
							}, this.intervalSec)
						}, this.waitSec)
					}
				}

		this.onTouchendAction = function (e) {
			// console.log(this.moveX,this.getDistance2);
					if (this.isSwiping) {
						console.log('%cswipeend','color:yellow');
						this.target.trigger('swipeend', [this.currentDirection, this.currentVelocity2])
						clearTimeout(this.timer)
						clearInterval(this.intervalTimer)
					} else {
						console.log('touched');
						this.target.trigger('touched',[this.moveX,this.moveY])
					}
			}

		this.onTouchstartAction = this.onTouchstartAction.bind(this)
		this.target[0].addEventListener('touchstart', this.onTouchstartAction, {passive:false});

		this.onTouchmoveAction = this.onTouchmoveAction.bind(this)
		this.target[0].addEventListener('touchmove', this.onTouchmoveAction, {passive:false});

		this.onTouchendAction = this.onTouchendAction.bind(this)
		this.target[0].addEventListener('touchend', this.onTouchendAction, {passive:false})
	}

	getDistance2 (): number {
		return this.currentDeltaX**2 + this.currentDeltaY**2;
	}

	getVelocity2 (): number {
		console.log(this.getDistance2(), this.currentDeltaT, this.getDistance2() / (this.currentDeltaT**2));
		return this.getDistance2() / (this.currentDeltaT**2);
	}

	getDirection (): string {
		console.log(this.isSwiping, this.currentDeltaX, this.currentDeltaY);
		if (this.isSwiping) {
			if (this.currentDeltaY >= this.currentDeltaX && this.currentDeltaY > -this.currentDeltaX) {
				return 'down';
			} else if (this.currentDeltaY >= -this.currentDeltaX && this.currentDeltaY < this.currentDeltaX) {
				return 'right';
			} else if (this.currentDeltaY <= this.currentDeltaX && this.currentDeltaY < -this.currentDeltaX) {
				return 'up';
			} else {
				return 'left';
			}
		} else {
			return 'notSwipe';
		}
	}

	destructor (): void {
		this.target[0].removeEventListener('touchstart',this.onTouchstartAction)
		this.target[0].removeEventListener('touchmove',this.onTouchmoveAction)
		this.target[0].removeEventListener('touchend',this.onTouchendAction)
	}
}
