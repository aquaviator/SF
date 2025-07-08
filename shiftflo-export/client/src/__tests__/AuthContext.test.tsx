import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from 'vitest';
import { AuthProvider, useAuth } from "../contexts/AuthContext";

const TestComponent = () => {
  const { role, switchRole, user, isAuthenticated } = useAuth();
  
  return (
    <div>
      <span data-testid="role">{role}</span>
      <span data-testid="authenticated">{isAuthenticated.toString()}</span>
      <span data-testid="user-name">{user?.firstName} {user?.lastName}</span>
      <button onClick={() => switchRole("staff")}>Switch to Staff</button>
      <button onClick={() => switchRole("owner")}>Switch to Owner</button>
    </div>
  );
};

describe("AuthContext", () => {
  it("provides default auth state", () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId("role")).toHaveTextContent("owner");
    expect(screen.getByTestId("authenticated")).toHaveTextContent("true");
    expect(screen.getByTestId("user-name")).toHaveTextContent("John Doe");
  });

  it("allows role switching", () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const staffButton = screen.getByText("Switch to Staff");
    fireEvent.click(staffButton);

    expect(screen.getByTestId("role")).toHaveTextContent("staff");
  });
});