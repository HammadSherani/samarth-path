"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Icon } from "@iconify/react";
import useDebounce from "@/hooks/useDebounce";
import { DataTable, Column, PaginationInfo } from "@/components/ui/DataTable";
import SummaryCards from "@/components/ui/SummaryCards";
import { CustomDropdown } from "@/components/ui/Dropdown";
import { Modal } from "@/components/ui/Modal";
import Image from "next/image";
// import Button from "@/components/ui/Button";
import SearchInput from "@/components/ui/SearchInput";

// ─── Types ────────────────────────────────────────────────────────────────────

interface User {
  _id: string;
  name: string;
  email: string;
  profilePicture?: string;
  role: string;
  status: string;
  isActive: boolean;
  createdAt: string;
}

interface SummaryData {
  totalUsers: number;
  totalProviders: number;
  totalCustomers: number;
  activeUsers: number;
  blockedUsers: number;
  pendingUsers: number;
}

interface QueryState {
  page: number;
  limit: number;
  search: string;
  role: string;
  status: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_USERS: User[] = [
  {
    _id: "1",
    name: "John Doe",
    email: "john@example.com",
    profilePicture: "",
    role: "provider",
    status: "approved",
    isActive: true,
    createdAt: "2023-10-01T10:00:00Z",
  },
  {
    _id: "2",
    name: "Jane Smith",
    email: "jane@example.com",
    profilePicture: "",
    role: "customer",
    status: "pending",
    isActive: true,
    createdAt: "2023-11-15T14:30:00Z",
  },
  {
    _id: "3",
    name: "Robert Johnson",
    email: "robert@tech.com",
    profilePicture: "",
    role: "provider",
    status: "blocked",
    isActive: false,
    createdAt: "2024-01-20T09:15:00Z",
  },
  {
    _id: "4",
    name: "Alice Brown",
    email: "alice@design.com",
    profilePicture: "",
    role: "customer",
    status: "suspended",
    isActive: false,
    createdAt: "2024-02-10T11:45:00Z",
  },
];

const MOCK_SUMMARY: SummaryData = {
  totalUsers: 150,
  totalProviders: 45,
  totalCustomers: 105,
  activeUsers: 120,
  blockedUsers: 10,
  pendingUsers: 20,
};

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "blocked", label: "Blocked" },
  { value: "suspended", label: "Suspended" },
];

const ROLE_OPTIONS = [
  { value: "", label: "All Roles" },
  { value: "customer", label: "Customer" },
  { value: "provider", label: "Provider" },
];

const STATUS_OPTIONS_FILTER = [
  { value: "", label: "All Statuses" },
  ...STATUS_OPTIONS,
];

const DEFAULT_QUERY: QueryState = {
  page: 1,
  limit: 10,
  search: "",
  role: "",
  status: "",
};

// ─── Status Cell ──────────────────

interface StatusCellProps {
  user: User;
  onStatusChange: (userId: string, newStatus: string) => void;
}

const StatusCell = React.memo(function StatusCell({ user, onStatusChange }: StatusCellProps) {
  const [localStatus, setLocalStatus] = useState<string>(user.status);

  const handleChange = (newValue: string | number) => {
    const statusStr = String(newValue);
    setLocalStatus(statusStr);
    onStatusChange(user._id, statusStr);
  };

  return (
    <div className="relative flex items-center gap-1.5">
      <CustomDropdown
        icon="mdi:shield-account-outline"
        placeholder={localStatus}
        value={localStatus}
        options={STATUS_OPTIONS}
        onChange={handleChange as any}
      />
    </div>
  );
});

// ─── Avatar Cell ──────────────────────────────────────────────────────────────

const AvatarCell = React.memo(function AvatarCell({ user }: { user: User }) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      {user.profilePicture ? (
        <Image
          src={user.profilePicture}
          alt={user.name}
          width={36}
          height={36}
          className="object-cover rounded-full w-9 h-9 shrink-0"
        />
      ) : (
        <div className="w-9 h-9 rounded-full bg-primary-400 flex items-center justify-center text-white font-semibold text-sm shrink-0">
          {user.name?.charAt(0)?.toUpperCase()}
        </div>
      )}
      <div className="flex flex-col leading-tight min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate max-w-40">
          {user.name}
        </p>
        <p className="text-xs text-gray-500 truncate max-w-40">
          {user.email}
        </p>
      </div>
    </div>
  );
});

// ─── Main Component ───────────────────────────────────────────────────────────

export default function UsersPage(): React.JSX.Element {
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [loading] = useState<boolean>(false);
  const [queryState, setQueryState] = useState<QueryState>(DEFAULT_QUERY);
  const [searchInput, setSearchInput] = useState<string>("");
  const debouncedSearch = useDebounce(searchInput, 500);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Filter logic for mock data
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch = u.name.toLowerCase().includes(debouncedSearch.toLowerCase()) || 
                            u.email.toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchesRole = queryState.role ? u.role === queryState.role : true;
      const matchesStatus = queryState.status ? u.status === queryState.status : true;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, debouncedSearch, queryState.role, queryState.status]);

  const pagination: PaginationInfo = {
    currentPage: queryState.page,
    totalPages: 1,
    totalItems: filteredUsers.length,
    itemsPerPage: queryState.limit,
    hasNextPage: false,
    hasPrevPage: false,
  };

  const handleStatusUpdate = (userId: string, status: string) => {
    setUsers((prev) =>
      prev.map((u) => (u._id === userId ? { ...u, status } : u))
    );
  };

  const handleDeleteUser = () => {
    if (!selectedUser) return;
    setUsers((prev) => prev.filter((u) => u._id !== selectedUser._id));
    setIsDeleteModalOpen(false);
    setSelectedUser(null);
  };

  const handleClearFilters = () => {
    setSearchInput("");
    setQueryState(DEFAULT_QUERY);
  };

  const columns: Column<User>[] = [
    {
      key: "name",
      header: "User",
      cell: (user) => <AvatarCell user={user} />,
    },
    {
      key: "role",
      header: "Role",
      cell: (user) => (
        <span className="capitalize px-2.5 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-medium whitespace-nowrap">
          {user.role}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (user) => (
        <StatusCell user={user} onStatusChange={handleStatusUpdate} />
      ),
    },
    {
      key: "createdAt",
      header: "Joined",
      cell: (user) => (
        <span className="text-sm text-gray-600 font-medium whitespace-nowrap">
          {new Date(user.createdAt).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      cell: (user) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setSelectedUser(user);
              setIsDeleteModalOpen(true);
            }}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
          >
            <Icon icon="mdi:trash-can-outline" className="w-5 h-5" />
          </button>
        </div>
      ),
    },
  ];

  const summaryCards = [
    { label: "Total Users", value: MOCK_SUMMARY.totalUsers, icon: "mdi:account-group-outline" },
    { label: "Total Providers", value: MOCK_SUMMARY.totalProviders, icon: "mdi:account-hard-hat" },
    { label: "Total Customers", value: MOCK_SUMMARY.totalCustomers, icon: "mdi:account-circle" },
    { label: "Blocked Users", value: MOCK_SUMMARY.blockedUsers, icon: "mdi:account-cancel-outline" },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-5 sm:space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Users (Mock Mode)
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Manage platform users and providers.
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <SummaryCards data={summaryCards as any} />
        </div>

        {/* Filters */}
        <div className="bg-white/80 backdrop-blur-xl border border-gray-100 shadow-sm rounded-2xl ">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 p-3">
            <div className="lg:col-span-5 w-full">
              <SearchInput
                value={searchInput}
                onChange={setSearchInput}
                placeholder="Search by name or email..."
              />
            </div>
            <div className="lg:col-span-3 w-full">
              <CustomDropdown
                icon="mdi:account-outline"
                placeholder="All Roles"
                options={ROLE_OPTIONS}
                value={queryState.role}
                onChange={(val) => setQueryState(p => ({...p, role: String(val), page: 1}))}
              />
            </div>
            <div className="lg:col-span-3 w-full">
              <CustomDropdown
                icon="mdi:filter-variant"
                placeholder="All Status"
                options={STATUS_OPTIONS_FILTER}
                value={queryState.status}
                onChange={(val) => setQueryState(p => ({...p, status: String(val), page: 1}))}
              />
            </div>
            <div className="lg:col-span-1 w-full lg:flex lg:items-end">
              {/* <Button
                onClick={handleClearFilters}
                icon="mdi:filter-remove-outline"
                variant="secondary"
              /> */}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white/80 backdrop-blur-xl border border-gray-100 shadow-sm rounded-2xl overflow-hidden">
          <DataTable
            columns={columns}
            data={filteredUsers}
            loading={loading}
            pagination={pagination}
            onPageChange={(page) => setQueryState((p) => ({ ...p, page }))}
            emptyTitle="No users found"
            emptyDescription="Try adjusting your filters."
            emptyIcon="mdi:account-search-outline"
          />
        </div>
      </div>

      {/* Delete Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete User"
      >
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <Icon icon="mdi:alert-outline" className="w-8 h-8 text-red-600" />
          </div>
          <p className="text-gray-600">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-gray-900">{selectedUser?.name}</span>?
          </p>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 px-4 py-2 bg-gray-100 rounded-xl">Cancel</button>
            <button onClick={handleDeleteUser} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl">Delete</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}