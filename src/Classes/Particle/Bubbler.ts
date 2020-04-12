import type { Container } from "../Container";
import type { IBubblerProcessParam } from "../../Interfaces/IBubblerProcessParam";
import { ProcessBubbleType } from "../../Enums/ProcessBubbleType";
import { Utils } from "../Utils/Utils";
import { HoverMode } from "../../Enums/Modes/HoverMode";
import { ClickMode } from "../../Enums/Modes/ClickMode";
import { Constants } from "../Utils/Constants";
import type { IParticle } from "../../Interfaces/IParticle";

/**
 * Particle bubble manager
 */
export class Bubbler {
	private readonly particle: IParticle;
	private readonly container: Container;

	constructor(container: Container, particle: IParticle) {
		this.container = container;
		this.particle = particle;
	}

	private static reset(particle: IParticle): void {
		delete particle.bubble.opacity;
		delete particle.bubble.radius;
	}

	public bubble(): void {
		const container = this.container;
		const options = container.options;
		const hoverEnabled = options.interactivity.events.onHover.enable;
		const hoverMode = options.interactivity.events.onHover.mode;
		const clickEnabled = options.interactivity.events.onClick.enable;
		const clickMode = options.interactivity.events.onClick.mode;

		/* on hover event */
		if (hoverEnabled && Utils.isInArray(HoverMode.bubble, hoverMode)) {
			this.hoverBubble();
		} else if (clickEnabled && Utils.isInArray(ClickMode.bubble, clickMode)) {
			this.clickBubble();
		}
	}

	private process(distMouse: number, timeSpent: number, data: IBubblerProcessParam): void {
		const container = this.container;
		const particle = this.particle;
		const options = container.options;
		const bubbleDuration = options.interactivity.modes.bubble.duration;
		const bubbleParam = data.bubbleObj.optValue;
		const bubbleDistance = container.retina.bubbleModeDistance;
		const particlesParam = data.particlesObj.optValue;
		const pObjBubble = data.bubbleObj.value;
		const pObj = data.particlesObj.value || 0;
		const type = data.type;

		if (bubbleParam !== particlesParam) {
			if (!container.bubble.durationEnd) {
				if (distMouse <= bubbleDistance) {
					const obj = pObjBubble ?? pObj;

					if (obj !== bubbleParam) {
						const value = pObj - (timeSpent * (pObj - bubbleParam) / bubbleDuration);

						if (type === ProcessBubbleType.size) {
							particle.bubble.radius = value;
						}

						if (type === ProcessBubbleType.opacity) {
							particle.bubble.opacity = value;
						}
					}
				} else {
					if (type === ProcessBubbleType.size) {
						particle.bubble.radius = undefined;
					}

					if (type === ProcessBubbleType.opacity) {
						particle.bubble.opacity = undefined;
					}
				}
			} else if (pObjBubble) {
				const value = bubbleParam * 2 - pObj - (timeSpent * (pObj - bubbleParam) / bubbleDuration);

				if (type === ProcessBubbleType.size) {
					particle.bubble.radius = value;
				}

				if (type === ProcessBubbleType.opacity) {
					particle.bubble.opacity = value;
				}
			}
		}
	}

	private clickBubble(): void {
		const container = this.container;
		const options = container.options;
		const particle = this.particle;

		/* on click event */
		const mouseClickPos = container.interactivity.mouse.clickPosition || { x: 0, y: 0 };
		const distMouse = Utils.getDistanceBetweenCoordinates(particle.position, mouseClickPos);
		const timeSpent = (new Date().getTime() - (container.interactivity.mouse.clickTime || 0)) / 1000;

		if (container.bubble.clicking) {
			if (timeSpent > options.interactivity.modes.bubble.duration) {
				container.bubble.durationEnd = true;
			}

			if (timeSpent > options.interactivity.modes.bubble.duration * 2) {
				container.bubble.clicking = false;
				container.bubble.durationEnd = false;
			}

			/* size */
			const sizeData: IBubblerProcessParam = {
				bubbleObj: {
					optValue: container.retina.bubbleModeSize,
					value: particle.bubble.radius,
				},
				particlesObj: {
					optValue: particle.sizeValue ?? container.retina.sizeValue,
					value: particle.size.value,
				},
				type: ProcessBubbleType.size,
			};

			this.process(distMouse, timeSpent, sizeData);

			/* opacity */
			const opacityData: IBubblerProcessParam = {
				bubbleObj: {
					optValue: options.interactivity.modes.bubble.opacity,
					value: particle.bubble.opacity,
				},
				particlesObj: {
					optValue: particle.particlesOptions.opacity.value,
					value: particle.opacity.value,
				},
				type: ProcessBubbleType.opacity,
			};

			this.process(distMouse, timeSpent, opacityData);
		}
	}

	private hoverBubble(): void {
		const container = this.container;
		const particle = this.particle;
		const mousePos = container.interactivity.mouse.position || {
			x: 0,
			y: 0,
		};
		const distMouse = Utils.getDistanceBetweenCoordinates(particle.position, mousePos);
		const ratio = 1 - distMouse / container.retina.bubbleModeDistance;

		/* mousemove - check ratio */
		if (distMouse <= container.retina.bubbleModeDistance) {
			if (ratio >= 0 && container.interactivity.status === Constants.mouseMoveEvent) {
				/* size */
				this.hoverBubbleSize(ratio);

				/* opacity */
				this.hoverBubbleOpacity(ratio);
			}
		} else {
			Bubbler.reset(particle);
		}

		/* mouseleave */
		if (container.interactivity.status === Constants.mouseLeaveEvent) {
			Bubbler.reset(particle);
		}
	}

	private hoverBubbleSize(ratio: number): void {
		const container = this.container;
		const options = container.options;
		const particle = this.particle;
		const modeSize = options.interactivity.modes.bubble.size;
		const optSize = particle.particlesOptions.size.value;
		const pSize = particle.size.value;

		if (container.retina.bubbleModeSize > (particle.sizeValue ?? container.retina.sizeValue)) {
			const size = pSize + modeSize * ratio;

			if (size > pSize && size <= modeSize) {
				particle.bubble.radius = size;
			}
		} else if (container.retina.bubbleModeSize < (particle.sizeValue ?? container.retina.sizeValue)) {
			const size = pSize - (optSize - modeSize) * ratio;

			if (size < pSize && size >= modeSize) {
				particle.bubble.radius = size;
			}
		}
	}

	private hoverBubbleOpacity(ratio: number): void {
		const container = this.container;
		const options = container.options;
		const particle = this.particle;
		const modeOpacity = options.interactivity.modes.bubble.opacity;
		const optOpacity = particle.particlesOptions.opacity.value;
		const pOpacity = particle.opacity.value;

		if (modeOpacity > optOpacity) {
			const opacity = pOpacity + modeOpacity * ratio;

			if (opacity > pOpacity && opacity <= modeOpacity) {
				particle.bubble.opacity = opacity;
			}
		} else if (modeOpacity < optOpacity) {
			const opacity = pOpacity - (optOpacity - modeOpacity) * ratio;

			if (opacity < pOpacity && opacity >= modeOpacity) {
				particle.bubble.opacity = opacity;
			}
		}
	}
}
