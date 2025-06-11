import { nextTick, onUnmounted, ref, watch } from "vue";

export function useElementTracker(containerRef, options = {}) {
	const getTextDimensions = (element) => {
		if (!element || !element.textContent) {
			return { width: 0, height: 0 };
		}
		const range = document.createRange();

		if (element.childNodes.length > 0) {
			range.selectNodeContents(element);
		} else {
			range.selectNode(element);
		}

		const rect = range.getBoundingClientRect();

		return {
			width: rect.width,
			height: rect.height,
		};
	};

	const getTextPosition = (element) => {
		if (!element || !element.textContent?.trim()) {
			return { x: 0, y: 0 };
		}

		let textNode = null;
		const findFirstTextNode = (node) => {
			if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
				return node;
			}
			for (let i = 0; i < node.childNodes.length; i++) {
				const found = findFirstTextNode(node.childNodes[i]);
				if (found) return found;
			}
			return null;
		};

		textNode = findFirstTextNode(element);
		if (!textNode) return { x: 0, y: 0 };

		const range = document.createRange();
		range.setStart(textNode, 0);
		range.setEnd(textNode, 1);

		const rect = range.getBoundingClientRect();
		const elRect = element.getBoundingClientRect();

		return {
			x: rect.left,
			y: rect.top,
		};
	};

	const gatherElements = (
		parentEl,
		containerRect,
		relative,
		excludeClasses
	) => {
		const result = [];

		const processElement = (el) => {
			if (
				excludeClasses.some((className) =>
					el.classList.contains(className)
				)
			) {
				return;
			}

			const rect = el.getBoundingClientRect();
			const data = {
				element: el,
				x: relative ? rect.left - containerRect.left : rect.left,
				y: relative ? rect.top - containerRect.top : rect.top,
				width: rect.width,
				height: rect.height,
				tagName: el.tagName.toLowerCase(),
				className: el.className,
				id: el.id || undefined,
			};

			if (
				[
					"h1",
					"h2",
					"h3",
					"h4",
					"h5",
					"h6",
					"p",
					"span",
					"div",
				].includes(data.tagName)
			) {
				data.text = el.textContent?.trim().substring(0, 50);

				const textDimensions = getTextDimensions(el);
				data.textWidth = textDimensions.width;
				data.textHeight = textDimensions.height;

				const textPos = getTextPosition(el);
				data.textX = relative
					? textPos.x - containerRect.left
					: textPos.x;
				data.textY = relative
					? textPos.y - containerRect.top
					: textPos.y;
			}

			result.push(data);

			if (el.tagName.toLowerCase() === "div") {
				Array.from(el.children).forEach((child) => {
					processElement(child);
				});
			}
		};

		Array.from(parentEl.children).forEach((child) => {
			processElement(child);
		});

		return result;
	};

	const {
		excludeClasses = ["interactive-demo"],
		includeContainer = true,
		throttleMs = 16,
		relative = true,
	} = options;

	const elementData = ref({
		container: null,
		elements: [],
		timestamp: Date.now(),
	});

	let resizeObserver = null;
	let mutationObserver = null;
	let rafId = null;
	let lastUpdate = 0;

	const updateElementData = () => {
		const now = Date.now();
		if (now - lastUpdate < throttleMs) {
			if (!rafId) {
				rafId = requestAnimationFrame(() => {
					rafId = null;
					updateElementData();
				});
			}
			return;
		}
		lastUpdate = now;

		if (!containerRef.value) {
			elementData.value = {
				container: null,
				elements: [],
				timestamp: now,
			};
			return;
		}

		const container = containerRef.value;
		const containerRect = container.getBoundingClientRect();

		elementData.value = {
			container: includeContainer
				? {
						x: containerRect.left,
						y: containerRect.top,
						width: containerRect.width,
						height: containerRect.height,
						element: container,
						ref: containerRef.value,
				  }
				: null,
			elements: gatherElements(
				container,
				containerRect,
				relative,
				excludeClasses
			),
			timestamp: now,
		};
	};

	const setupObservers = () => {
		if (!containerRef.value) return;

		resizeObserver = new ResizeObserver((entries) => {
			updateElementData();
		});

		resizeObserver.observe(containerRef.value);
		Array.from(containerRef.value.children).forEach((child) => {
			resizeObserver.observe(child);
		});

		mutationObserver = new MutationObserver((mutations) => {
			const hasChildListChange = mutations.some(
				(m) => m.type === "childList"
			);

			if (hasChildListChange) {
				Array.from(containerRef.value.children).forEach((child) => {
					resizeObserver.observe(child);
				});
			}

			updateElementData();
		});

		mutationObserver.observe(containerRef.value, {
			childList: true,
			subtree: true,
			attributes: true,
			attributeFilter: ["class", "style"],
		});
	};

	const cleanup = () => {
		if (resizeObserver) {
			resizeObserver.disconnect();
			resizeObserver = null;
		}
		if (mutationObserver) {
			mutationObserver.disconnect();
			mutationObserver = null;
		}
		if (rafId) {
			cancelAnimationFrame(rafId);
			rafId = null;
		}
	};

	watch(
		containerRef,
		(newVal, oldVal) => {
			if (oldVal) cleanup();
			if (newVal) {
				nextTick(() => {
					setupObservers();
					updateElementData();
				});
			}
		},
		{ immediate: true }
	);

	onUnmounted(() => {
		cleanup();
	});

	const refresh = () => {
		updateElementData();
	};

	const getCanvasRelativeData = (canvasRect) => {
		const data = elementData.value;
		if (!data.container) return null;

		return {
			container: {
				...data.container,
				x: data.container.x - canvasRect.left,
				y: data.container.y - canvasRect.top,
			},
			elements: data.elements.map((el) => ({
				...el,
				x: el.x + (relative ? data.container.x : 0) - canvasRect.left,
				y: el.y + (relative ? data.container.y : 0) - canvasRect.top,
			})),
		};
	};

	return {
		elementData,
		refresh,
		getCanvasRelativeData,
		cleanup,
	};
}



export class MouseInteractionManager {
    constructor(app, engine, camera) {
        this.app = app;
        this.engine = engine;
        this.camera = camera;
        
        this.mousePos = { x: 0, y: 0 };
        this.mouseDown = false;
        this.isDragging = false;
        this.draggedBodyIndex = -1;
        

        this.currentTool = 'select';
        this.toolConfig = {
            box: { width: 20, height: 20 },
            circle: { radius: 10 },
            spring: { stiffness: 300, damping: 10, anchorMode: 'body' },
            motor: { targetVelocity: 5 }
        };
        

        this.interactionResults = [];
        this.springPreview = null;
        

        this.onBodyAdded = null;
        this.onForceAdded = null;
    }
    
    setTool(tool) {
        this.currentTool = tool;
        this.clearInteractionResults();
    }
    
    updateToolConfig(tool, config) {
        this.toolConfig[tool] = { ...this.toolConfig[tool], ...config };
    }
    
    screenToWorld(screenX, screenY) {
        return { x: screenX, y: screenY };
    }
    
    onPointerDown(event) {
        const rect = this.app.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const worldPos = this.screenToWorld(x, y);
        
        this.mousePos = worldPos;
        this.mouseDown = true;
        
        switch (this.currentTool) {
            case 'select':
                this.handleSelectTool(worldPos);
                break;
            case 'box':
                this.addBox(worldPos);
                break;
            case 'circle':
                this.addCircle(worldPos);
                break;
            case 'spring':
                this.handleSpringTool(worldPos);
                break;
            case 'motor':
                this.handleMotorTool(worldPos);
                break;
        }
    }
    
    onPointerMove(event) {
        const rect = this.app.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const worldPos = this.screenToWorld(x, y);
        
        this.mousePos = worldPos;
        
        if (this.isDragging && this.draggedBodyIndex >= 0) {
            this.engine.update_mouse_position(worldPos.x, worldPos.y);
        }
        
        if (this.currentTool === 'spring' && this.interactionResults.length === 1) {
            this.updateSpringPreview(worldPos);
        }
    }
    
    onPointerUp() {
        this.mouseDown = false;
        
        if (this.isDragging) {
            this.engine.end_mouse_drag();
            this.isDragging = false;
            this.draggedBodyIndex = -1;
        }
    }
    
    handleSelectTool(worldPos) {
        const bodyIndex = this.engine.start_mouse_drag(worldPos.x, worldPos.y);
        
        if (bodyIndex >= 0) {
            this.isDragging = true;
            this.draggedBodyIndex = bodyIndex;
        }
    }
    
    addBox(worldPos) {
        const config = this.toolConfig.box;
        const index = this.engine.addBoxBody(
            worldPos.x, 
            worldPos.y, 
            config.width, 
            config.height, 
            false
        );
        
        this.engine.addGravity(index);
        
        if (this.onBodyAdded) {
            this.onBodyAdded('box', index, worldPos);
        }
    }
    
    addCircle(worldPos) {
        const config = this.toolConfig.circle;
        const index = this.engine.addCircleBody(
            worldPos.x, 
            worldPos.y, 
            config.radius, 
            false
        );
        
        this.engine.addGravity(index);
        
        if (this.onBodyAdded) {
            this.onBodyAdded('circle', index, worldPos);
        }
    }
    
    handleSpringTool(worldPos) {
        const bodyIndex = this.engine.getBodyAtPosition(worldPos.x, worldPos.y);
        
        if (this.toolConfig.spring.anchorMode === 'body' && bodyIndex >= 0) {
            this.interactionResults.push({
                bodyIndex,
                worldPos: { ...worldPos },
                localPos: this.worldToLocal(worldPos, bodyIndex)
            });
            
            if (this.interactionResults.length === 2) {
                const config = this.toolConfig.spring;
                this.engine.addSpringBetween(
                    this.interactionResults[0].bodyIndex,
                    this.interactionResults[1].bodyIndex,
                    config.stiffness,
                    config.damping
                );
                
                if (this.onForceAdded) {
                    this.onForceAdded('spring', this.interactionResults);
                }
                
                this.clearInteractionResults();
            }
        } else if (this.toolConfig.spring.anchorMode === 'fixed') {
            if (bodyIndex >= 0) {
                const config = this.toolConfig.spring;
                this.engine.addSpringToPoint(
                    bodyIndex,
                    worldPos.x,
                    worldPos.y,
                    config.stiffness,
                    config.damping
                );
                
                if (this.onForceAdded) {
                    this.onForceAdded('spring', [{ bodyIndex, worldPos }]);
                }
            }
        }
    }
    
    handleMotorTool(worldPos) {
        const bodyIndex = this.engine.getBodyAtPosition(worldPos.x, worldPos.y);
        
        if (bodyIndex >= 0) {
            const config = this.toolConfig.motor;
            this.engine.addMotorToBody(bodyIndex, config.targetVelocity);
            
            if (this.onForceAdded) {
                this.onForceAdded('motor', [{ bodyIndex }]);
            }
        }
    }
    
    worldToLocal(worldPos, bodyIndex) {
        const bodyX = this.engine.getBodyX(bodyIndex);
        const bodyY = this.engine.getBodyY(bodyIndex);
        const angle = this.engine.getBodyAngle(bodyIndex);
        
        const dx = worldPos.x - bodyX;
        const dy = worldPos.y - bodyY;
        const cos = Math.cos(-angle);
        const sin = Math.sin(-angle);
        
        return {
            x: dx * cos - dy * sin,
            y: dx * sin + dy * cos
        };
    }
    
    updateSpringPreview(worldPos) {

        if (this.springPreview) {
            this.springPreview.updateEndPoint(worldPos);
        }
    }
    
    clearInteractionResults() {
        this.interactionResults = [];
        if (this.springPreview) {
            this.springPreview.clear();
        }
    }
}
