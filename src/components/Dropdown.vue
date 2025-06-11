<template>
    <div class="dropdown" ref="dropdownRef" :class="{ 'dropdown--open': isOpen, 'dropdown--focused': isFocused }">
        <label v-if="label" class="dropdown__label">{{ label }}</label>
        
        <div class="dropdown__container" @click="toggleDropdown" @keydown="handleKeydown" tabindex="0"
            @focus="isFocused = true" @blur="handleBlur">
            
            <div class="dropdown__selected">
                <span class="dropdown__value">{{ selectedLabel || placeholder }}</span>
                <svg class="dropdown__chevron" width="12" height="12" viewBox="0 0 12 12">
                    <path d="M2 4L6 8L10 4" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </div>
            
            <span class="dropdown__underline"></span>
        </div>
        
        <Transition name="dropdown-menu">
            <div v-if="isOpen" class="dropdown__menu" @mousedown.prevent>
                <div class="dropdown__menu-inner">
                    <div v-for="(option, index) in options" :key="option.value"
                        class="dropdown__option"
                        :class="{ 
                            'dropdown__option--selected': option.value === modelValue,
                            'dropdown__option--highlighted': highlightedIndex === index
                        }"
                        @click="selectOption(option)"
                        @mouseenter="highlightedIndex = index">
                        
                        <span class="dropdown__option-text">{{ option.label }}</span>
                        <svg v-if="option.value === modelValue" class="dropdown__option-check" width="16" height="16" viewBox="0 0 16 16">
                            <path d="M2 8L6 12L14 4" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </div>
                </div>
            </div>
        </Transition>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps({
    modelValue: {
        type: [String, Number],
        default: ''
    },
    options: {
        type: Array,
        required: true,
        validator: (options) => {
            return options.every(opt => 
                typeof opt === 'object' && 
                'value' in opt && 
                'label' in opt
            )
        }
    },
    placeholder: {
        type: String,
        default: 'Select an option'
    },
    label: {
        type: String,
        default: ''
    }
})

const emit = defineEmits(['update:modelValue', 'change'])

const dropdownRef = ref(null)
const isOpen = ref(false)
const isFocused = ref(false)
const highlightedIndex = ref(-1)

const selectedLabel = computed(() => {
    const selected = props.options.find(opt => opt.value === props.modelValue)
    return selected ? selected.label : ''
})

function toggleDropdown() {
    if (isOpen.value) {
        closeDropdown()
    } else {
        openDropdown()
    }
}

function openDropdown() {
    isOpen.value = true
    highlightedIndex.value = props.options.findIndex(opt => opt.value === props.modelValue)
    if (highlightedIndex.value === -1) highlightedIndex.value = 0
}

function closeDropdown() {
    isOpen.value = false
    highlightedIndex.value = -1
}

function selectOption(option) {
    emit('update:modelValue', option.value)
    emit('change', option.value)
    closeDropdown()
}

function handleBlur() {
    isFocused.value = false
    setTimeout(() => {
        if (!dropdownRef.value?.contains(document.activeElement)) {
            closeDropdown()
        }
    }, 200)
}

function handleKeydown(event) {
    switch (event.key) {
        case 'Enter':
        case ' ':
            event.preventDefault()
            if (isOpen.value && highlightedIndex.value >= 0) {
                selectOption(props.options[highlightedIndex.value])
            } else {
                toggleDropdown()
            }
            break
            
        case 'ArrowDown':
            event.preventDefault()
            if (!isOpen.value) {
                openDropdown()
            } else {
                highlightedIndex.value = Math.min(highlightedIndex.value + 1, props.options.length - 1)
            }
            break
            
        case 'ArrowUp':
            event.preventDefault()
            if (isOpen.value) {
                highlightedIndex.value = Math.max(highlightedIndex.value - 1, 0)
            }
            break
            
        case 'Escape':
            event.preventDefault()
            closeDropdown()
            break
            
        case 'Home':
            if (isOpen.value) {
                event.preventDefault()
                highlightedIndex.value = 0
            }
            break
            
        case 'End':
            if (isOpen.value) {
                event.preventDefault()
                highlightedIndex.value = props.options.length - 1
            }
            break
    }
}

function handleClickOutside(event) {
    if (!dropdownRef.value?.contains(event.target)) {
        closeDropdown()
    }
}

onMounted(() => {
    document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
})

watch(() => props.modelValue, () => {
    highlightedIndex.value = props.options.findIndex(opt => opt.value === props.modelValue)
})
</script>

<style scoped>
.dropdown {
    position: relative;
    width: 100%;
    min-width: 8rem;
}

.dropdown__label {
    display: block;
    font-weight: 600;
    font-size: 14px;
    color: #ccc;
    margin-bottom: 4px;
    transition: color 0.3s ease;
}

.dropdown--focused .dropdown__label {
    color: rgb(140, 172, 204);
}

.dropdown__container {
    position: relative;
    cursor: pointer;
    user-select: none;
}

.dropdown__selected {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.3rem 0;
    color: #fff;
    font-size: 14px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.dropdown__value {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.dropdown__chevron {
    margin-left: 8px;
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    color: #ccc;
}

.dropdown--open .dropdown__chevron {
    transform: rotate(180deg);
}

.dropdown__underline {
    position: absolute;
    bottom: 0;
    left: 0;
    height: 2px;
    width: 0;
    background-color: rgb(140, 172, 204);
    transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border-radius: 9999px;
}

.dropdown__container:hover .dropdown__underline,
.dropdown--focused .dropdown__underline {
    width: 100%;
}

.dropdown__menu {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    margin-top: 8px;
    background-color: rgb(36, 36, 36);
    border-radius: 8px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1);
    z-index: 1000;
    overflow: hidden;
}

.dropdown__menu-inner {
    max-height: 240px;
    overflow-y: auto;
    padding: 8px;
    
    scrollbar-width: thin;
    scrollbar-color: rgba(140, 172, 204, 0.3) transparent;
}

.dropdown__menu-inner::-webkit-scrollbar {
    width: 6px;
}

.dropdown__menu-inner::-webkit-scrollbar-track {
    background: transparent;
}

.dropdown__menu-inner::-webkit-scrollbar-thumb {
    background-color: rgba(140, 172, 204, 0.3);
    border-radius: 3px;
}

.dropdown__menu-inner::-webkit-scrollbar-thumb:hover {
    background-color: rgba(140, 172, 204, 0.5);
}

.dropdown__option {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 12px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
}

.dropdown__option::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(90deg, transparent, rgba(140, 172, 204, 0.1), transparent);
    transform: translateX(-100%);
    transition: transform 0.6s ease;
}

.dropdown__option:hover::before {
    transform: translateX(100%);
}

.dropdown__option:hover {
    background-color: rgba(140, 172, 204, 0.1);
    transform: translateX(4px);
}

.dropdown__option--highlighted {
    background-color: rgba(140, 172, 204, 0.15);
}

.dropdown__option--selected {
    color: rgb(140, 172, 204);
    font-weight: 600;
}

.dropdown__option-text {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.dropdown__option-check {
    margin-left: 8px;
    color: rgb(140, 172, 204);
    animation: checkIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.dropdown-menu-enter-active,
.dropdown-menu-leave-active {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.dropdown-menu-enter-from {
    opacity: 0;
    transform: translateY(-12px) scale(0.95);
}

.dropdown-menu-leave-to {
    opacity: 0;
    transform: translateY(-8px) scale(0.95);
}

@keyframes checkIn {
    from {
        transform: scale(0) rotate(-180deg);
        opacity: 0;
    }
    50% {
        transform: scale(1.2) rotate(10deg);
    }
    to {
        transform: scale(1) rotate(0);
        opacity: 1;
    }
}


.dropdown__container:focus {
    outline: none;
}

.dropdown__container:focus-visible {
    outline: 2px solid rgb(140, 172, 204);
    outline-offset: 2px;
    border-radius: 4px;
}


@media (max-width: 768px) {
    .dropdown__menu {
        position: fixed;
        top: auto;
        bottom: 0;
        left: 0;
        right: 0;
        margin: 0;
        border-radius: 16px 16px 0 0;
        max-height: 70vh;
    }
    
    .dropdown__menu-inner {
        max-height: 60vh;
        padding: 16px;
    }
    
    .dropdown__option {
        padding: 14px 16px;
    }
}
</style>
