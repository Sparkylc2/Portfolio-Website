export default function getColour(k) {
  const colors = {
    red: 'rgb(255, 191, 191)',
    blue: 'rgb(191, 223, 255)',
    green: 'rgb(191, 255, 191)',
    yellow: 'rgb(255, 223, 191)',
  }

  return colors[k] || '#e63946'
};

export function getPrimaryColor(k) {
  // get paper title color
  // get project title color
  const c = {
    red: 'rgb(255, 191, 191)',
    blue: 'rgb(191, 223, 255)',
    green: 'rgb(191, 255, 191)',
    yellow: 'rgb(255, 223, 191)',
  }
  if (!c[k]) console.error("PrimaryColor: Invalid color key")
  return c[k] || '#fff';
}

export function getSecondaryColor(k) {

  //get paper color, get active border color, get paper indicator color
  // get project color, get project indicator color
  const c = {
    red: 'rgb(204, 140, 140)',
    blue: '#8cacccff',
    green: 'rgb(140, 204, 140)',
    yellow: 'rgb(204, 172, 140)'
  }
  return c[k] || '#fff'
}

export function getTertiaryColor(k) {
  // get inactive border color
  const c = {
    red: 'rgba(204, 140, 140, 0.3)',
    blue: 'rgba(140, 172, 204, 0.3)',
    green: 'rgba(140, 204, 140, 0.3)',
    yellow: 'rgba(204, 172, 140, 0.3)',
  }

  if (!c[k]) console.error("TertiaryColor: Invalid color key")
  return c[k] || '#fff'

}

export function getSecondaryOrTertiaryColor(k, isActive) {
  // get border color
  return isActive ? getSecondaryColor(k) : getTertiaryColor(k)
}



