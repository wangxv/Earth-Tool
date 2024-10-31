export default function insertWatermark(watermarkText) {
  function createWatermark() {
    const watermark = document.createElement('div');  
    watermark.className = '__watermark__';  
    watermark.textContent = watermarkText;  
    watermark.style = `
        position: fixed;  
        top: 0;  
        left: 0;  
        width: 100%;  
        height: 100%;  
        background: rgba(255, 255, 255, 0.7);  
        pointer-events: none;
        display: flex;  
        align-items: center;  
        justify-content: center;  
        font-size: 24px;  
        color: rgba(0, 0, 0, 0.3);
        z-index: 9999; 
        transform: rotate(45deg);
    `;
    document.body.appendChild(watermark);  
  }
  createWatermark();
  const observer = new MutationObserver((mutations) => {
    const watermark = document.querySelector('.__watermark__');

    if (!watermark) {
      createWatermark()
    }
  });
  // 配置观察选项  
  const config = { childList: true, subtree: true };  

  // 选择需要观察变动的节点  
  const targetNode = document.body;  
  
  // 开始观察  
  observer.observe(targetNode, config);  
};
