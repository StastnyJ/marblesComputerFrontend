import { Alert, Button, Dialog, DialogActions, DialogContent, Snackbar } from "@mui/material";
import React, { useState } from "react";

export default function SubmitModal({ code }: { code: string }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "wrong" | "correct">("idle");
  const [response, setResponse] = useState("");

  const submit = (task: string) => {
    setStatus("loading");
    fetch(`https://api.marblescomputer.stastnyjakub.com/submit/${task}`, {
      method: "POST",
      cache: "no-cache",
      body: code,
    })
      .then((resp) =>
        resp.ok
          ? resp
              .json()
              .then((result: { status: "correct" | "wrong" | "error"; data: string }) => {
                console.log(result);
                setStatus(result?.status || "error");
                setResponse(result.data);
              })
              .catch(() => setStatus("error"))
          : setStatus("error")
      )
      .catch(() => setStatus("error"));
  };

  return (
    <>
      <Button
        onClick={() => {
          setOpen(true);
          setStatus("idle");
          setResponse("");
        }}
        variant="contained"
        color="primary"
        fullWidth
      >
        Submit
      </Button>
      <Dialog fullWidth maxWidth="sm" open={open} onClose={() => setOpen(false)}>
        <DialogContent>
          <Button disabled={status === "loading"} onClick={() => submit("max")} variant="contained" color="primary" fullWidth>
            Submit as the 1st subtask solution (maximum)
          </Button>
          <br />
          <br />
          <Button disabled={status === "loading"} onClick={() => submit("nBit")} variant="contained" color="primary" fullWidth>
            Submit as the 2nd subtask solution (n-th bit)
          </Button>
          <br />
          <br />
          <Button disabled={status === "loading"} onClick={() => submit("sort")} variant="contained" color="primary" fullWidth>
            Submit as the 3rd subtask solution (sort)
          </Button>
        </DialogContent>
        <DialogActions>
          <Button color="secondary" onClick={() => setOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        anchorOrigin={{ horizontal: "center", vertical: "top" }}
        open={status !== "idle" && status !== "loading"}
        autoHideDuration={10000}
        onClose={() => setStatus("idle")}
      >
        <Alert variant="filled" severity={status === "error" ? "error" : status === "correct" ? "success" : "warning"} onClose={() => setStatus("idle")}>
          {status === "error"
            ? `There was an error while evaluation your solution. Please try it later.`
            : status === "wrong"
            ? `Your program is not correct.`
            : `Your program is correct. The password part is: ${response}`}
        </Alert>
      </Snackbar>
    </>
  );
}
