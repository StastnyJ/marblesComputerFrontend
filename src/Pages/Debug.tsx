import React, { useState } from "react";
import { Alert, Button, Grid, IconButton, TextField, Toolbar, Typography } from "@mui/material";
import { commandToString, enlargeState, parseCode, Program, simulateProgram, Simulation } from "../Utils/LanguageUtils";
import { ArrowLeft, ArrowRight } from "@mui/icons-material";
import SubmitModal from "../Components/SubmitModal";

const defaultInput = [
  "0",
  "0",
  "0",
  "0",
  "0",
  "0",
  "0",
  "0",
  "0",
  "0",
  "0",
  "0",
  "0",
  "0",
  "0",
  "0",
  "0",
  "0",
  "0",
  "0",
  "0",
  "0",
  "0",
  "0",
  "0",
  "0",
  "0",
  "0",
  "0",
  "0",
  "0",
  "0",
];

interface IProps {
  setEditMode: () => void;
}

export default function Debug({ setEditMode }: IProps) {
  const [input, setInput] = useState<string[]>([...defaultInput]);
  const [simulation, setSimulation] = useState<Simulation | undefined>(undefined);
  const [step, setStep] = useState(0);

  const rawCode = localStorage.getItem("rawCode") || "";
  const code = parseCode(rawCode) as Program;

  const getLabel = (commandNumber: number) => (code === undefined ? "" : Object.keys(code.labels).find((l) => code.labels[l] === commandNumber) || "");

  //@ts-ignore
  const inputOk = input.map((inp) => isFinite(inp) && !inp.includes(".") && !inp.includes(".") && parseInt(inp) >= 0).reduce((a, b) => a && b, true);
  const parsedInput = input.map((inp) => parseInt(inp));

  const runSimulation = () => {
    const result = simulateProgram(code, parsedInput);
    setSimulation(result);
    setStep(0);
  };

  const drawState = (state: number[]) => (
    <table style={{ borderCollapse: "collapse" }}>
      {Array.from(new Array(Math.ceil(enlargeState(state, 1).length / 32))).map((_, row) => (
        <tr key={row}>
          {enlargeState(state, 31)
            .slice(row * 32, (row + 1) * 32)
            .map((val, i) => (
              <td
                style={{
                  border: "1px solid black",
                  padding: 0,
                }}
                key={i}
              >
                <Typography style={{ width: 25, padding: 0, border: "none", textAlign: "center" }}>{val}</Typography>
              </td>
            ))}
        </tr>
      ))}
    </table>
  );

  return (
    <>
      {code === undefined ? (
        <>
          <Alert color="warning">Your code syntax is not correct</Alert>
        </>
      ) : (
        <>
          <Typography variant="h6">Input</Typography>
          <table style={{ borderCollapse: "collapse" }}>
            {Array.from(new Array(input.length / 32)).map((_, row) => (
              <tr key={row}>
                {input.slice(row * 32, (row + 1) * 32).map((inp, i) => (
                  <td
                    style={{
                      //@ts-ignore
                      border: isFinite(inp) && !inp.includes(".") && !inp.includes(".") && parseInt(inp) >= 0 ? "1px solid black" : "1px solid red",
                      padding: 0,
                    }}
                    key={i}
                  >
                    <input
                      type="text"
                      value={inp}
                      style={{ width: 25, padding: 0, border: "none", textAlign: "center" }}
                      onChange={(e) => setInput(input.map((iinp, ii) => (i === ii ? e.target.value : iinp)))}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </table>
          <Button color="primary" onClick={() => setInput([...input, ...input.map((x) => "0")])}>
            Enlarge input
          </Button>
          {input.length > 32 && (
            <Button color="secondary" onClick={() => setInput(input.splice(0, input.length / 2))}>
              Shrink input
            </Button>
          )}
          <br />
          <Button onClick={runSimulation} disabled={!inputOk} color="primary" fullWidth variant="contained">
            RUN
          </Button>
          <br />
          <br />
          {simulation !== undefined && (
            <>
              <Typography variant="h6">Output</Typography>
              {simulation.status === "success" ? (
                drawState(simulation.steps[simulation.steps.length - 1].stateAfterStep)
              ) : (
                <Alert color="warning">Simulation did not finish successfully.</Alert>
              )}
              <br />
              <Typography variant="h4">Step by step</Typography>
              <Toolbar>
                <Typography>Step: </Typography>
                <IconButton onClick={() => setStep(Math.max(step - 1, 0))}>
                  <ArrowLeft />
                </IconButton>
                <TextField type="number" variant="standard" value={step} onChange={(e) => setStep(parseInt(e.target.value))} />
                <IconButton onClick={() => setStep(Math.min(step + 1, simulation.steps.length - 1))}>
                  <ArrowRight />
                </IconButton>
              </Toolbar>
              {!isNaN(step) && step >= 0 && step < simulation.steps.length && (
                <>
                  <Typography variant="h6">Status before step {step}</Typography>
                  {drawState(step === 0 ? simulation.input : simulation.steps[step - 1].stateAfterStep)}
                  <br />
                  <Typography variant="h6">
                    Executed command:&nbsp;&nbsp;&nbsp;&nbsp;
                    {commandToString(code.commands[simulation.steps[step]?.ic || 0])}
                  </Typography>
                  <br />
                  <Typography variant="h6">Status after step {step}</Typography>
                  {simulation.status === "fail" && step === simulation.steps.length - 1 ? (
                    <Alert color="warning">Step did not finish successfully.</Alert>
                  ) : (
                    drawState(simulation.steps[step].stateAfterStep)
                  )}
                  <br />
                </>
              )}
            </>
          )}
          <Typography variant="h6">Code</Typography>
          <Grid container spacing={3}>
            {code.commands.map((c, i) => (
              <React.Fragment key={i}>
                <Grid item xs={3}>
                  {i}&nbsp;&nbsp;&nbsp;&nbsp;<span style={{ color: "grey" }}>{getLabel(i)}</span>
                </Grid>
                <Grid item xs={9}>
                  <span style={{ color: simulation?.steps[step]?.ic === i ? "red" : undefined }}>{commandToString(c)}</span>
                </Grid>
              </React.Fragment>
            ))}
          </Grid>
        </>
      )}
      <br />
      <Button onClick={setEditMode} variant="contained" color="secondary" fullWidth>
        Edit code
      </Button>
      <br />
      <br />
      <SubmitModal code={rawCode} />
      <br />
      <br />
    </>
  );
}
