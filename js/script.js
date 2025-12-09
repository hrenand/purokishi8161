// 定数
const cardW = 61;
const cardH = 81;
const gapSmall = 1.0;
const gapLarge = 2.0;

const dropZone = document.getElementById('dropZone');
const imageList = document.getElementById('imageList');
const pagesContainer = document.getElementById('pagesContainer');

// 印刷ボタンを追加
const printBtn = document.createElement('button');
printBtn.id = 'printBtn';
printBtn.textContent = '印刷する';
document.body.insertBefore(printBtn, pagesContainer);

// 画像情報管理
let cards = [];

// ファイル読み込み
function loadFiles(files) {
  const filesToAdd = files;
  let loaded = 0;
  filesToAdd.forEach((file) => {
    const reader = new FileReader();
    reader.onload = () => {
      cards.push({ src: reader.result, scale: 1 });
      loaded++;
      if (loaded === filesToAdd.length) {
        renderAll();
      }
    };
    reader.readAsDataURL(file);
  });
}

// 再描画
function renderAll() {
  renderImageList();
  renderPages();
}

// リスト表示
function renderImageList() {
  imageList.innerHTML = '';
  cards.forEach((card, idx) => {
    const div = document.createElement('div');
    div.className = 'image-item';

    const img = document.createElement('img');
    img.src = card.src;
    div.appendChild(img);

    const controls = document.createElement('div');
    controls.className = 'image-controls';

    const minusBtn = document.createElement('button');
    minusBtn.textContent = '−';
    minusBtn.title = '枚数を減らす';
    minusBtn.onclick = () => {
      if (card.scale > 1) {
        card.scale--;
        renderAll();
      }
    };
    controls.appendChild(minusBtn);

    const countSpan = document.createElement('span');
    countSpan.textContent = card.scale + ' 枚';
    countSpan.style.minWidth = '36px';
    countSpan.style.textAlign = 'center';
    countSpan.style.userSelect = 'none';
    controls.appendChild(countSpan);

    const plusBtn = document.createElement('button');
    plusBtn.textContent = '+';
    plusBtn.title = '枚数を増やす';
    plusBtn.onclick = () => {
      if (card.scale < 999) {
        card.scale++;
        renderAll();
      }
    };
    controls.appendChild(plusBtn);

    // 🔽 追加：削除ボタン 
    const deleteBtn = document.createElement('button');
deleteBtn.textContent = '✖';
deleteBtn.className = 'delete-btn';
deleteBtn.title = 'この画像を削除';
deleteBtn.onclick = () => {
  cards.splice(idx, 1);
  renderAll();
};
div.appendChild(deleteBtn);

    div.appendChild(controls);
    imageList.appendChild(div);
  });
}

// ページ分割表示
function renderPages() {
  pagesContainer.innerHTML = '';

  let expandedCards = [];
  cards.forEach(card => {
    for (let i = 0; i < card.scale; i++) {
      expandedCards.push(card.src);
    }
  });

  const cardsPerPage = 10;
  const pageCount = Math.ceil(expandedCards.length / cardsPerPage);

  for (let p = 0; p < pageCount; p++) {
    const pageDiv = document.createElement('div');
    pageDiv.className = 'a4-page';

    const slice = expandedCards.slice(p * cardsPerPage, (p + 1) * cardsPerPage);
    renderImagesOnPage(pageDiv, slice);

    pagesContainer.appendChild(pageDiv);
  }
}

function renderImagesOnPage(container, imgs) {
  let i = 0;

  let top = 0;
  const leftX = 0;
  for (let n = 0; n < 4 && i < imgs.length; n++) {
    addImage(container, imgs[i++], leftX, top, 'horizontal');
    top += cardW + gapSmall;
  }

  top = 0;
  const middleX = cardH + gapSmall;
  for (let n = 0; n < 3 && i < imgs.length; n++) {
    addImage(container, imgs[i++], middleX, top, 'vertical');
    top += cardH + gapLarge;
  }

  top = 0;
  const rightX = middleX + cardW + gapSmall;
  for (let n = 0; n < 3 && i < imgs.length; n++) {
    addImage(container, imgs[i++], rightX, top, 'vertical');
    top += cardH + gapLarge;
  }
}

function addImage(container, src, x, y, orientation) {
  const img = document.createElement('img');
  img.src = src;
  img.classList.add('card', orientation);
  img.style.left = `${x}mm`;
  img.style.top = `${y}mm`;
  container.appendChild(img);
}

// 印刷処理
printBtn.addEventListener('click', () => {
  const pages = Array.from(document.querySelectorAll('.a4-page'));
  const canvasPromises = pages.map(page =>
    html2canvas(page, { scale: 2 })
  );

  Promise.all(canvasPromises).then(canvases => {
    const printWindow = window.open('', '_blank');
    const imagesHTML = canvases.map(canvas => {
      const dataUrl = canvas.toDataURL('image/png');
      return `<img src="${dataUrl}" style="width:100%;page-break-after:always;" />`;
    }).join('\n');

    printWindow.document.write(`
      <html>
        <head>
          <title>印刷</title>
          <style>
            body { margin: 0; padding: 0; }
            img { display: block; width: 100%; page-break-after: always; }
          </style>
        </head>
        <body>
          ${imagesHTML}
          <script>
            window.onload = function() {
              window.focus();
              window.print();
            };
          <\/script>
        </body>
      </html>
    `);
    printWindow.document.close();
  });
});

// 一括操作
document.getElementById('bulkPlus').addEventListener('click', () => {
  cards.forEach(card => {
    if (card.scale < 999) card.scale++;
  });
  renderAll();
});

document.getElementById('bulkMinus').addEventListener('click', () => {
  cards.forEach(card => {
    if (card.scale > 1) card.scale--;
  });
  renderAll();
});

// ドラッグ＆ドロップ
document.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('dragover');
});

document.addEventListener('dragleave', (e) => {
  e.preventDefault();
  if (e.relatedTarget === null || e.relatedTarget === document.documentElement) {
    dropZone.classList.remove('dragover');
  }
});

document.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('dragover');
  const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
  if (files.length > 0) {
    loadFiles(files);
  }
});
