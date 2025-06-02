<template>
    <div class="math-editor" :style="primaryColorStyle">
        <math-field ref="mf" v-model="inputValue" virtual-keyboard-mode="off" toolbar-mode="hidden"
            menu-bar-visible="false" allow-tex-symbols="sqrt,sin,cos,tan,exp,ln,log" smart-fence
            :style="primaryColorStyle"></math-field>
    </div>
</template>

<script setup>
import { MathfieldElement } from 'mathlive'
import 'mathlive/static.css'
import { computed, onMounted, ref, watch } from 'vue'
import getColour from '../composables/useGetColours.js'

const props = defineProps({
    modelValue: { type: String, default: '' },
    primaryColorKey: { type: String, default: '#007bff' }
})

const primaryColorStyle = computed(() => ({ '--underline-color': getColour(props.primaryColorKey) }));

console.log(props.primaryColorKey);

const emit = defineEmits(['update:modelValue', 'update:plaintext'])

const inputValue = ref(props.modelValue)
const isUpdating = ref(false)
const mf = ref(null);

const forbidden = ['\\int', '\\sum', '\\prod', '\\lim', '\\matrix', '\\begin{matrix}']

function blockForbidden(cmd) {
    return !forbidden.some(f => cmd.includes(f))
}

function sanitizeLatex(latex) {
    if (!latex) return ''

    let result = ''
    let i = 0
    const n = latex.length

    while (i < n) {
        const ch = latex[i]

        if (ch === '\\') {
            let cmd = '\\'
            i++
            while (i < n && /[a-zA-Z]/.test(latex[i])) {
                cmd += latex[i++]
            }

            if (cmd === '\\text') {
                result += cmd
                let braceDepth = 0
                while (i < n) {
                    result += latex[i]
                    if (latex[i] === '{') braceDepth++
                    else if (latex[i] === '}') {
                        braceDepth--
                        if (braceDepth === 0) {
                            i++
                            break
                        }
                    }
                    i++
                }
            } else {
                result += cmd
            }
        } else if ('{}^_()[]+-*/= '.includes(ch)) {
            result += ch
            i++
        } else {
            let run = ''
            while (i < n && /[a-zA-Z0-9.]/.test(latex[i]) && !'{}^_()[]+-*/= \\'.includes(latex[i])) {
                run += latex[i++]
            }
            if (run) {
                result += `\\text{${run}}`
            }
        }
    }

    return result
}

watch(inputValue, raw => {
    if (isUpdating.value) return
    if (!blockForbidden(raw)) return

    const wrapped = sanitizeLatex(raw)
    if (wrapped === raw) {
        emit('update:modelValue', raw)
        emit('update:plaintext', mf.value?.getValue('plain-text') || '')
        return
    }

    isUpdating.value = true
    inputValue.value = wrapped
    emit('update:modelValue', wrapped)
    emit('update:plaintext', mf.value?.getValue('plain-text') || '')

    queueMicrotask(() => {
        isUpdating.value = false
    })
})

watch(() => props.modelValue, val => {
    if (isUpdating.value) return
    if (val !== inputValue.value) inputValue.value = val
})

onMounted(async () => {
    await customElements.whenDefined('math-field')
    MathfieldElement.fontsDirectory = null
    mf.value.fontFamily = 'Inter, sans-serif'
    mf.value.textfontFamily = 'Inter, sans-serif'
    mf.value.mathfontFamily = 'FiraMath, serif'

    mf.value.mathModeSpace = '\\:';
    mf.value.addEventListener('keydown', (ev) => {
        if (ev.key === '\\') {
            ev.preventDefault();
            mf.executeCommand(['insert', '\\backslash']);
        } else if (ev.key === 'Escape') ev.preventDefault();
    },
        { capture: true }
    );


    mf.value.setValue(sanitizeLatex(props.modelValue), { emit: false })
})

</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap');

@font-face {
    font-family: 'FiraMath';
    src: url('/fonts/FiraMath-Regular.woff2') format('woff2');
    font-weight: 400;
    font-style: normal;
    font-display: swap;
}

.math-editor {
    position: relative;
    width: 8rem;
}

.math-editor::after {
    content: '';
    position: absolute;
    left: 0;
    bottom: -2px;
    width: 100%;
    height: 2px;
    background: var(--underline-color, rgb(191, 223, 255));
    border-radius: 9999px;
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.math-editor:hover::after,
.math-editor:focus-within::after {
    transform: scaleX(1);
}

math-field {
    width: 100%;
    border: none;
    outline: none;
    background: rgb(36, 36, 36);
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    font-size: 14px;
    padding: 0;
    color: #fff;
    --selection-background-color: Highlight;
    --selection-color: #fff;
    --contains-highlight-background-color: transparent;
    --highlight-text: rgba(255, 255, 255, 0.1);
    --ML__font-family: 'Inter', sans-serif;
    --ML__textfont-family: 'Inter', sans-serif;
    --ML__mathfont-family: 'FiraMath', serif;
}


math-field::part(container) {
    background-color: transparent;
    color: #fff;
}

@media not (pointer: coarse) {
    math-field::part(virtual-keyboard-toggle) {
        display: none;
    }
}

math-field::part(menu-toggle) {
    display: none;
}
</style>
