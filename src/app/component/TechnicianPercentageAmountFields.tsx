"use client";

import React from "react";
import { InputAdornment, TextField } from "@mui/material";

interface TechnicianPercentageAmountFieldsProps {
  percentage: number;
  amount: number;
  onPercentageChange: (value: string) => void;
  onAmountChange: (value: string) => void;
}

const TechnicianPercentageAmountFields: React.FC<TechnicianPercentageAmountFieldsProps> = ({
  percentage,
  amount,
  onPercentageChange,
  onAmountChange,
}) => {
  return (
    <div className="flex items-center gap-2 shrink-0">
      <TextField
        size="small"
        type="number"
        label="Per Tech %"
        color="warning"
        value={Number.isFinite(percentage) ? percentage : ""}
        onChange={(e) => onPercentageChange(e.target.value)}
        inputProps={{ min: 0, max: 100, step: 0.01 }}
        sx={{ width: 120 }}
      />
      <TextField
        size="small"
        type="number"
        label="Amount"
        color="warning"
        value={Number.isFinite(amount) ? amount : ""}
        onChange={(e) => onAmountChange(e.target.value)}
        inputProps={{ min: 0, step: 0.01 }}
        InputProps={{
          startAdornment: <InputAdornment position="start">$</InputAdornment>,
        }}
        sx={{ width: 130 }}
      />
    </div>
  );
};

export default TechnicianPercentageAmountFields;
