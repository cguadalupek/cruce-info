function FileUploadBox({ label, helperText, file, onFileChange, inputId }) {
  function handleChange(event) {
    const selectedFile = event.target.files?.[0] ?? null;
    if (selectedFile && !selectedFile.name.toLowerCase().endsWith(".xlsx")) {
      onFileChange(null);
      event.target.value = "";
      return;
    }
    onFileChange(selectedFile);
  }

  return (
    <label className="upload-box" htmlFor={inputId}>
      <span className="upload-title">{label}</span>
      <span className="upload-helper">{helperText}</span>
      <span className="upload-status">
        {file ? file.name : "Haz clic para seleccionar un archivo .xlsx"}
      </span>
      <input
        id={inputId}
        type="file"
        accept=".xlsx"
        className="sr-only"
        onChange={handleChange}
      />
    </label>
  );
}

export default FileUploadBox;
