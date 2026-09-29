// ========================================
// P2P FILE DROP
// MAIN JAVASCRIPT
// ========================================

// ========================================
// 1. APPLICATION START
// ========================================

console.log("P2P File Drop application started");
// ========================================
// APPLICATION STATE
// ========================================

let selectedFilesState = [];

// ========================================
// 2. DOM ELEMENTS
// ========================================

const fileInput = document.getElementById("file-input");

const selectedFiles = document.getElementById("selected-files");

const createOfferButton = document.getElementById("create-offer");

const copyOfferButton = document.getElementById("copy-offer");

const createAnswerButton = document.getElementById("create-answer");

const copyAnswerButton = document.getElementById("copy-answer");

const offerCode = document.getElementById("offer-code");

const receivedOffer = document.getElementById("received-offer");

const answerCode = document.getElementById("answer-code");

const fileSummary = document.getElementById("file-summary");

// ========================================
// 3. DOM CONNECTION TEST
// ========================================

console.log("File Input:", fileInput);
console.log("Selected Files Container:", selectedFiles);
console.log("Create Offer Button:", createOfferButton);
console.log("Copy Offer Button:", copyOfferButton);
console.log("Create Answer Button:", createAnswerButton);
console.log("Copy Answer Button:", copyAnswerButton);
console.log("Offer Code:", offerCode);
console.log("Received Offer:", receivedOffer);
console.log("Answer Code:", answerCode);

// ========================================
// 4. FILE SIZE FORMATTER
// ========================================

function formatFileSize(bytes) {
  if (bytes === 0) {
    return "0 Bytes";
  }

  const units = ["Bytes", "KB", "MB", "GB"];

  const index = Math.floor(Math.log(bytes) / Math.log(1024));

  const size = bytes / Math.pow(1024, index);

  return `${size.toFixed(2)} ${units[index]}`;
}

// ========================================
// CHECK DUPLICATE FILE
// ========================================

function isDuplicateFile(file) {

    return selectedFilesState.some(function (existingFile) {

        return (
            existingFile.name === file.name &&
            existingFile.size === file.size &&
            existingFile.lastModified === file.lastModified
        );

    });

}

// ========================================
// CALCULATE TOTAL FILE SIZE
// ========================================

function calculateTotalSize(files) {

    return files.reduce(function (total, file) {

        return total + file.size;

    }, 0);

}


// ========================================
// RENDER SELECTED FILES
// ========================================

function renderSelectedFiles() {
  selectedFiles.innerHTML = "";

  // No files
  if (selectedFilesState.length === 0) {
    const message = document.createElement("p");

    message.textContent = "No files selected.";

    selectedFiles.appendChild(message);

    return;
  }

  // Render every file
  selectedFilesState.forEach(function (file, index) {
    const fileItem = document.createElement("div");

    fileItem.className = "file-item";

    const fileInfo = document.createElement("div");

    fileInfo.className = "file-info";

    const fileName = document.createElement("strong");

    fileName.textContent = file.name;

    const fileSize = document.createElement("span");

    fileSize.textContent = formatFileSize(file.size);

    fileInfo.appendChild(fileName);

    fileInfo.appendChild(fileSize);

    // Remove button
    const removeButton = document.createElement("button");

    removeButton.className = "remove-file";

    removeButton.textContent = "Remove";

    // Store file index
    removeButton.dataset.index = index;

    fileItem.appendChild(fileInfo);

    fileItem.appendChild(removeButton);

    selectedFiles.appendChild(fileItem);
  });

  renderFileSummary();

}

// ========================================
// REMOVE FILE
// ========================================

selectedFiles.addEventListener("click", function (event) {
  if (!event.target.classList.contains("remove-file")) {
    return;
  }

  const index = Number(event.target.dataset.index);

  selectedFilesState.splice(index, 1);

  renderSelectedFiles();
});

// ========================================
// 6. FILE SELECTION EVENT
// ========================================

fileInput.addEventListener("change", function () {

    const newFiles = Array.from(fileInput.files);


    newFiles.forEach(function (file) {

        if (!isDuplicateFile(file)) {

            selectedFilesState.push(file);

        }

    });


    console.log("Selected files:", selectedFilesState);

    renderSelectedFiles();

});

// ========================================
// 6. RENDER FILE SUMMARY
// ========================================



function renderFileSummary() {

    if (selectedFilesState.length === 0) {

        fileSummary.textContent = "";

        return;
    }

    const totalSize =
        calculateTotalSize(selectedFilesState);

    const totalFiles =
        selectedFilesState.length;

    fileSummary.textContent =
        `${totalFiles} file${totalFiles !== 1 ? "s" : ""} · ${formatFileSize(totalSize)}`;
}