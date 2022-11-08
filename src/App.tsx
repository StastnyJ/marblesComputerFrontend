import React, { useState } from "react";
import { Container } from "@mui/material";
import Debug from "./Pages/Debug";
import Edit from "./Pages/Edit";

export default function App() {
  const [page, setPage] = useState<"edit" | "debug">("edit");

  return (
    <Container maxWidth="md">{page === "edit" ? <Edit setDebugMode={() => setPage("debug")} /> : <Debug setEditMode={() => setPage("edit")} />}</Container>
  );
}
