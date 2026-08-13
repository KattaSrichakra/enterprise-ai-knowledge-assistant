from pathlib import Path

import pandas as pd
from langchain_core.documents import Document

from app.rag.loaders.base_loader import BaseLoader


class ExcelLoader(BaseLoader):
    """
    Loads Excel workbooks and converts worksheets
    into LangChain Document objects.
    """

    SUPPORTED_EXTENSIONS = {
        ".xls",
        ".xlsx",
    }

    def load(self, source: str) -> list[Document]:
        """
        Load an Excel workbook.

        Each worksheet is converted into a separate
        LangChain Document.
        """

        file_path = Path(source)

        if not file_path.exists():
            raise FileNotFoundError(
                f"Excel file not found: {file_path}"
            )

        if not file_path.is_file():
            raise ValueError(
                f"Source is not a file: {file_path}"
            )

        extension = file_path.suffix.lower()

        if extension not in self.SUPPORTED_EXTENSIONS:
            raise ValueError(
                f"Unsupported Excel file type: {extension}"
            )

        try:
            engine = (
                "openpyxl"
                if extension == ".xlsx"
                else "xlrd"
            )

            workbook = pd.ExcelFile(
                file_path,
                engine=engine,
            )

            documents: list[Document] = []

            for sheet_name in workbook.sheet_names:
                dataframe = pd.read_excel(
                    workbook,
                    sheet_name=sheet_name,
                    engine=engine,
                )

                if dataframe.empty:
                    continue

                dataframe = dataframe.fillna("")

                rows: list[str] = []

                for row in dataframe.to_dict(
                    orient="records"
                ):
                    row_text = " | ".join(
                        f"{key}: {value}"
                        for key, value in row.items()
                        if str(value).strip()
                    )

                    if row_text:
                        rows.append(row_text)

                if not rows:
                    continue

                content = (
                    f"Worksheet: {sheet_name}\n\n"
                    + "\n".join(rows)
                )

                documents.append(
                    Document(
                        page_content=content,
                        metadata={
                            "source": str(file_path),
                            "source_type": "excel",
                            "file_name": file_path.name,
                            "sheet_name": sheet_name,
                        },
                    )
                )

            workbook.close()

            if not documents:
                raise ValueError(
                    "No readable data was found in the Excel file."
                )

            return documents

        except (FileNotFoundError, ValueError):
            raise

        except Exception as e:
            raise RuntimeError(
                f"Failed to load Excel file: {file_path}"
            ) from e