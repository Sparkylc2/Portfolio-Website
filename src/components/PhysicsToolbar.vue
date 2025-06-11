<template>
    <div class="physics-toolbar" :class="{ expanded: isExpanded }">
        <button class="toolbar-toggle" @click="isExpanded = !isExpanded">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path v-if="!isExpanded" d="M4 6h16M4 12h16M4 18h16" />
                <path v-else d="M6 18L18 6M6 6l12 12" />
            </svg>
        </button>
        
        <transition name="slide">
            <div v-if="isExpanded" class="toolbar-content">
                <div class="tool-section">
                    <h3>Tools</h3>
                    <div class="tool-buttons">
                        <button
                            v-for="tool in tools"
                            :key="tool.id"
                            :class="{ active: currentTool === tool.id }"
                            @click="selectTool(tool.id)"
                            :title="tool.label"
                        >
                            <component :is="tool.icon" />
                            <span>{{ tool.label }}</span>
                        </button>
                    </div>
                </div>
                
                <div class="config-section" v-if="currentToolConfig">
                    <h3>{{ currentToolLabel }} Settings</h3>
                    <div class="config-controls">
                        <template v-if="currentTool === 'box'">
                            <label>
                                Width:
                                <input
                                    v-model.number="toolConfigs.box.width"
                                    type="number"
                                    step="1"
                                    min="5"
                                    max="100"
                                    @change="updateConfig"
                                />
                                <span class="underline"></span>
                            </label>
                            <label>
                                Height:
                                <input
                                    v-model.number="toolConfigs.box.height"
                                    type="number"
                                    step="1"
                                    min="5"
                                    max="100"
                                    @change="updateConfig"
                                />
                                <span class="underline"></span>
                            </label>
                        </template>
                        
                        <template v-else-if="currentTool === 'circle'">
                            <label>
                                Radius:
                                <input
                                    v-model.number="toolConfigs.circle.radius"
                                    type="number"
                                    step="1"
                                    min="5"
                                    max="50"
                                    @change="updateConfig"
                                />
                                <span class="underline"></span>
                            </label>
                        </template>
                        
                        <template v-else-if="currentTool === 'spring'">
                            <label>
                                Mode:
                                <select v-model="toolConfigs.spring.anchorMode" @change="updateConfig">
                                    <option value="body">Body to Body</option>
                                    <option value="fixed">Fixed Anchor</option>
                                </select>
                            </label>
                            <label>
                                Stiffness:
                                <input
                                    v-model.number="toolConfigs.spring.stiffness"
                                    type="number"
                                    step="10"
                                    min="10"
                                    max="1000"
                                    @change="updateConfig"
                                />
                                <span class="underline"></span>
                            </label>
                            <label>
                                Damping:
                                <input
                                    v-model.number="toolConfigs.spring.damping"
                                    type="number"
                                    step="1"
                                    min="0"
                                    max="50"
                                    @change="updateConfig"
                                />
                                <span class="underline"></span>
                            </label>
                        </template>
                        
                        <template v-else-if="currentTool === 'motor'">
                            <label>
                                Target Velocity:
                                <input
                                    v-model.number="toolConfigs.motor.targetVelocity"
                                    type="number"
                                    step="0.5"
                                    min="-20"
                                    max="20"
                                    @change="updateConfig"
                                />
                                <span class="underline"></span>
                            </label>
                        </template>
                    </div>
                </div>
                
                <div class="action-section">
                    <button @click="clearAll" class="danger-button">Clear All</button>
                    <button @click="togglePause" class="pause-button">
                        {{ isPaused ? 'Resume' : 'Pause' }}
                    </button>
                </div>
            </div>
        </transition>
    </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

// Tool icons as inline components
const SelectIcon = {
    template: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/>
    </svg>`
}

const BoxIcon = {
    template: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
    </svg>`
}

const CircleIcon = {
    template: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <circle cx="12" cy="12" r="9"/>
    </svg>`
}

const SpringIcon = {
    template: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M3 12s3-6 6 0-3 6 0 0 3-6 6 0-3 6 0 0"/>
    </svg>`
}

const MotorIcon = {
    template: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <circle cx="12" cy="12" r="3"/>
        <path d="M12 2v4m0 12v4M2 12h4m12 0h4"/>
    </svg>`
}

const props = defineProps({
    mouseManager: Object,
    engine: Object
})

const emit = defineEmits(['toolChanged', 'configUpdated', 'clearAll', 'togglePause'])

const isExpanded = ref(false)
const currentTool = ref('select')
const isPaused = ref(false)

const tools = [
    { id: 'select', label: 'Select', icon: SelectIcon },
    { id: 'box', label: 'Box', icon: BoxIcon },
    { id: 'circle', label: 'Circle', icon: CircleIcon },
    { id: 'spring', label: 'Spring', icon: SpringIcon },
    { id: 'motor', label: 'Motor', icon: MotorIcon }
]

const toolConfigs = ref({
    box: { width: 20, height: 20 },
    circle: { radius: 10 },
    spring: { stiffness: 300, damping: 10, anchorMode: 'body' },
    motor: { targetVelocity: 5 }
})

const currentToolConfig = computed(() => {
    return currentTool.value !== 'select' ? toolConfigs.value[currentTool.value] : null
})

const currentToolLabel = computed(() => {
    const tool = tools.find(t => t.id === currentTool.value)
    return tool ? tool.label : ''
})

function selectTool(toolId) {
    currentTool.value = toolId
    emit('toolChanged', toolId)
    if (props.mouseManager) {
        props.mouseManager.setTool(toolId)
    }
}

function updateConfig() {
    if (props.mouseManager && currentToolConfig.value) {
        props.mouseManager.updateToolConfig(currentTool.value, currentToolConfig.value)
    }
    emit('configUpdated', currentTool.value, currentToolConfig.value)
}

function clearAll() {
    if (confirm('Are you sure you want to clear all bodies?')) {
        emit('clearAll')
    }
}

function togglePause() {
    isPaused.value = !isPaused.value
    if (props.engine) {
        props.engine.setPaused(isPaused.value)
    }
    emit('togglePause', isPaused.value)
}

// Watch for external pause state changes
watch(() => props.engine?.isPaused, (paused) => {
    if (paused !== undefined) {
        isPaused.value = paused
    }
})
</script>

<style scoped>
.physics-toolbar {
    position: absolute;
    top: 1rem;
    left: 1rem;
    z-index: 1000;
    transition: all 0.3s ease;
}

.toolbar-toggle {
    background: rgb(36, 36, 36);
    border: none;
    color: #fff;
    padding: 0.5rem;
    border-radius: 0.5rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
}

.toolbar-toggle:hover {
    background: rgb(50, 50, 50);
    transform: scale(1.05);
}

.toolbar-content {
    position: absolute;
    top: 3rem;
    left: 0;
    background: rgb(36, 36, 36);
    border-radius: 0.5rem;
    padding: 1rem;
    min-width: 250px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
}

.tool-section,
.config-section,
.action-section {
    margin-bottom: 1rem;
}

.tool-section:last-child,
.config-section:last-child,
.action-section:last-child {
    margin-bottom: 0;
}

h3 {
    color: #ccc;
    font-size: 14px;
    margin-bottom: 0.5rem;
    font-weight: 600;
}

.tool-buttons {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
}

.tool-buttons button {
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: #ccc;
    padding: 0.5rem;
    border-radius: 0.25rem;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    transition: all 0.3s ease;
    font-size: 12px;
}

.tool-buttons button:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: translateY(-2px);
}

.tool-buttons button.active {
    background: rgb(140, 172, 204);
    color: #fff;
    border-color: rgb(140, 172, 204);
}

.config-controls {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.config-controls label {
    position: relative;
    display: flex;
    flex-direction: column;
    font-size: 12px;
    color: #ccc;
}

.config-controls input,
.config-controls select {
    all: unset;
    font-size: 14px;
    padding: 0.3rem 0;
    color: #fff;
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    transition: border-color 0.3s ease;
    width: 100%;
}

.config-controls select {
    cursor: pointer;
    padding-right: 1rem;
}

.config-controls .underline {
    position: absolute;
    bottom: 0;
    left: 0;
    height: 2px;
    width: 0;
    background-color: rgb(140, 172, 204);
    transition: width 0.3s ease;
}

.config-controls input:focus ~ .underline {
    width: 100%;
}

.action-section {
    display: flex;
    gap: 0.5rem;
    padding-top: 0.5rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.danger-button,
.pause-button {
    flex: 1;
    padding: 0.5rem;
    border: none;
    border-radius: 0.25rem;
    cursor: pointer;
    font-size: 12px;
    font-weight: 600;
    transition: all 0.3s ease;
}

.danger-button {
    background: transparent;
    color: #ff7875;
    border: 1px solid #ff7875;
}

.danger-button:hover {
    background: #ff7875;
    color: #fff;
}

.pause-button {
    background: transparent;
    color: rgb(140, 172, 204);
    border: 1px solid rgb(140, 172, 204);
}

.pause-button:hover {
    background: rgb(140, 172, 204);
    color: #fff;
}

.slide-enter-active,
.slide-leave-active {
    transition: all 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
    opacity: 0;
    transform: translateY(-10px);
}
</style>
