import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { Employee, EmployeeType } from "./employeeType";

export const employeeApi = createApi({
  reducerPath: "employeeApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api/pos-close-control/" }),
  endpoints: (builder) => ({
    getEmployeesByType: builder.query<Employee[], EmployeeType>({
      query: (type) => `employee/${type}`,
    }),
  }),
});

export const { useGetEmployeesByTypeQuery } = employeeApi;
