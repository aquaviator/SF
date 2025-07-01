import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DataTable, Column } from "../components/DataTable";

interface TestData {
  id: number;
  name: string;
  email: string;
}

const testData: TestData[] = [
  { id: 1, name: "John Doe", email: "john@example.com" },
  { id: 2, name: "Jane Smith", email: "jane@example.com" },
];

const testColumns: Column<TestData>[] = [
  { key: "name", header: "Name" },
  { key: "email", header: "Email" },
];

describe("DataTable", () => {
  it("renders table with data", () => {
    render(
      <DataTable
        data={testData}
        columns={testColumns}
        title="Test Table"
      />
    );

    expect(screen.getByText("Test Table")).toBeInTheDocument();
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("jane@example.com")).toBeInTheDocument();
  });

  it("shows empty state when no data", () => {
    render(
      <DataTable
        data={[]}
        columns={testColumns}
        title="Empty Table"
      />
    );

    expect(screen.getByText("No data available")).toBeInTheDocument();
  });

  it("shows loading state", () => {
    render(
      <DataTable
        data={[]}
        columns={testColumns}
        title="Loading Table"
        isLoading={true}
      />
    );

    expect(screen.queryByText("No data available")).not.toBeInTheDocument();
  });

  it("shows add button when onAdd provided", () => {
    const onAdd = vi.fn();
    
    render(
      <DataTable
        data={testData}
        columns={testColumns}
        title="Test Table"
        onAdd={onAdd}
        addLabel="Add Item"
      />
    );

    expect(screen.getByText("Add Item")).toBeInTheDocument();
  });
});
