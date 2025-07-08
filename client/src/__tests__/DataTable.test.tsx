import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from 'vitest';
import { DataTable } from "../components/DataTable";

interface TestData {
  id: number;
  name: string;
  email: string;
}

const mockData: TestData[] = [
  { id: 1, name: "John Doe", email: "john@example.com" },
  { id: 2, name: "Jane Smith", email: "jane@example.com" },
];

const mockColumns = [
  { key: "name", header: "Name" },
  { key: "email", header: "Email" },
];

describe("DataTable", () => {
  it("renders data table with data", () => {
    render(
      <DataTable
        data={mockData}
        columns={mockColumns}
        title="Test Table"
      />
    );

    expect(screen.getByText("Test Table")).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("jane@example.com")).toBeInTheDocument();
  });

  it("shows loading state", () => {
    render(
      <DataTable
        data={[]}
        columns={mockColumns}
        title="Test Table"
        isLoading={true}
      />
    );

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });
});