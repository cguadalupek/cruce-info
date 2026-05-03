function ExportButton({ disabled, isLoading, onClick }) {
  return (
    <button
      className="secondary-button"
      type="button"
      disabled={disabled}
      onClick={onClick}
    >
      {isLoading ? "Exportando..." : "Exportar Excel"}
    </button>
  );
}

export default ExportButton;
