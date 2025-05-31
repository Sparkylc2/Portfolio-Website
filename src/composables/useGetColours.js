export default function getColour(k) {
    const colors = {
        red: 'rgb(255, 191, 191)',
        blue: 'rgb(191, 223, 255)',
        green: 'rgb(191, 255, 191)',
        yellow: 'rgb(255, 223, 191)',
    }

    return colors[k] || '#e63946'
};
