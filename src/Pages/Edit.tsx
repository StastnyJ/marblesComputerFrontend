import React, { useState } from "react";
import { Button, TextField, Typography } from "@mui/material";
import { parseCode } from "../Utils/LanguageUtils";
import SubmitModal from "../Components/SubmitModal";

interface IProps {
  setDebugMode: () => void;
}

export default function Edit({ setDebugMode }: IProps) {
  const [code, setCode] = useState(localStorage.getItem("rawCode") || "");

  const changeCode = (newCode: string) => {
    localStorage.setItem("rawCode", newCode);
    setCode(newCode);
  };

  return (
    <>
      <Typography variant="h6">Code</Typography>
      <TextField variant="outlined" multiline fullWidth rows={32} value={code} onChange={(e) => changeCode(e.target.value)} />
      <br />
      <br />
      <Button onClick={() => (parseCode(code) === undefined ? alert("Wrong syntax") : alert("Correct syntax"))} variant="contained" color="secondary" fullWidth>
        Test syntax
      </Button>
      <br />
      <br />
      <Button onClick={setDebugMode} variant="contained" color="secondary" fullWidth>
        Run & debug code
      </Button>
      <br />
      <br />
      <SubmitModal code={code} />
      <br />
      <br />
    </>
  );
}
