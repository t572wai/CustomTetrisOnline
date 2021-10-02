let pressTimer = new Map<string, NodeJS.Timer>();
let pressInterval = new Map<string, NodeJS.Timer>();
let pressDidLongpressed = new Map<string, boolean>();

export function setButtonActions(obj: string, waitSec: number = 300, intervalSec: number = 50) {
	let target = $(obj);
	//console.log(obj,target);
	$(document).on('touchstart', obj, (e) => {
		//const $this: Document = this;
		$(e.currentTarget).trigger('pressstart');
		pressDidLongpressed.set(obj, false);
		//console.log('pressstart');
		pressTimer.set(obj, setTimeout(function () {
			$(e.currentTarget).trigger('longpress');
			pressDidLongpressed.set(obj, true);
			pressInterval.set(obj, setInterval(function () {
				//console.log('longpress');
				$(e.currentTarget).trigger('longpress')
			}, intervalSec))
		}, waitSec))
	})

	$(document).on('touchend', obj, (e) => {
		$(e.currentTarget).trigger('pressend');
		if (pressDidLongpressed.get(obj)) {
			$(e.currentTarget).trigger('shortpress');
		}
		clearTimeout(pressTimer.get(obj)!);
		clearInterval(pressInterval.get(obj)!);
	})
}
