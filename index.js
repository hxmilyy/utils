/**
 * @description 获取设备类型，mobile，tablet，desktop
 * @returns {string} 设备类型
 */
function getDeviceType() {
  const ua = navigator.userAgent;
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return "tablet";
  }
  else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    return "mobile";
  }
  return "desktop";
};

/**
 * @description 返回translateX和translateY
 * @param {DOMElement} item 
 * @returns {array} translateX 和 translateY
 */
function getTranslate(item) {
  const transArr = [];
  if (!window.getComputedStyle) {
    return;
  }
  const style = window.getComputedStyle(item);
  const transform = style.transform || style.webkitTransform;
  let mat = transform.match(/^matrix3d\((.+)\)$/);
  if (mat) {
    return parseFloat(mat[1].split(', ')[13]);
  }
  mat = transform.match(/^matrix\((.+)\)$/);
  mat ? transArr.push(parseInt(mat[1].split(', ')[4], 10)) : transArr.push(0);
  mat ? transArr.push(parseInt(mat[1].split(', ')[5], 10)) : transArr.push(0);

  return transArr;
}

/**
 * @description 获取transform的矩阵matrix数组
 * @param {DOMElement} item 
 * @returns {array} matrix的值构成的数组
 */
function getTransformMatrix(item) {
  let transArr = [];
  if (!window.getComputedStyle) {
    return;
  }
  const style = window.getComputedStyle(item);
  const transform = style.transform || style.webkitTransform;
  let mat = transform.match(/^matrix3d\((.+)\)$/);
  if (mat) {
    return parseFloat(mat[1].split(', ')[13]);
  }
  mat = transform.match(/^matrix\((.+)\)$/);
  // mat ? transArr.push(parseInt(mat[1].split(', ')[4], 10)) : transArr.push(0);
  // mat ? transArr.push(parseInt(mat[1].split(', ')[5], 10)) : transArr.push(0);
  if (mat) {
    transArr = mat[1].split(', ').map(n => parseInt(n, 10));
  }

  return transArr;
}