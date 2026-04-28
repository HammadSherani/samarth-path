"use client";

import React, { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";
import axiosInstance from "@/config/axiosInstance";
import { getConfig } from "@/store/slicer";
import useDebounce from "@/hooks/useDebounce";
import { DataTable, Column, PaginationInfo } from "@/components/ui/DataTable";
import { FilterBar } from "@/components/ui/FilterBar";
import SummaryCards, { SummaryCardSkeleton } from "@/components/ui/SummaryCards";
import { CustomDropdown } from "@/components/ui/Dropdown";
import { Modal } from "@/components/ui/Modal";
// import Button from "@/components/ui/Button";
import SearchInput from "@/components/ui/SearchInput";

interface ServiceRequest {
  _id: string;
  providerId: {
    userId: {
      name: string;
      email: string;
    };
  };
  serviceId: {
    name: string;
    price: number;
  }[];   //  FIXED HERE
  categoryId: {
    name: string;
  };
  status: string;
  rejectionReason?: string;
  createdAt: string;
}
interface SummaryData {
  totalServiceRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
}

export default function RequestsPage() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const [queryState, setQueryState] = useState({
    page: 1,
    limit: 10,
    search: "",
    status: "",
  });

  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 500);

  // Modals
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject">("approve");
  const [reason, setReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    setQueryState((prev) => ({ ...prev, search: debouncedSearch, page: 1 }));
  }, [debouncedSearch]);

  const fetchRequests = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", queryState.page.toString());
      params.append("limit", queryState.limit.toString());
      if (queryState.search) params.append("search", queryState.search);
      if (queryState.status) params.append("status", queryState.status);

      const response = await axiosInstance.get(`/service-requests?${params.toString()}`, getConfig());
      if (response.data.success) {
        setRequests(response.data.data.requests);
        setPagination(response.data.data.pagination);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to fetch requests");
    } finally {
      if (showLoader) setLoading(false);
    }
  }, [queryState]);

  const fetchStats = async () => {
    try {
      const response = await axiosInstance.get("/service-requests/stats", getConfig());
      if (response.data.success) {
        setSummaryData(response.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch stats", error);
    }
  };

  useEffect(() => {
    fetchRequests(true);
  }, [fetchRequests]);

  useEffect(() => {
    fetchStats();
  }, []);

  const handleAction = async () => {
    if (!selectedRequest) return;
    setActionLoading(true);
    try {
      let url = `/service-requests/${selectedRequest._id}/${actionType}`;
      let data = actionType === "reject" ? { rejectionReason: reason } : undefined;

      const response = await axiosInstance.patch(url, data, getConfig());
      if (response.data.success) {
        toast.success(`Request ${actionType}d successfully`);
        setIsActionModalOpen(false);
        setReason("");
        setSelectedRequest(null);
        fetchRequests(false);
        fetchStats();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Failed to ${actionType} request`);
    } finally {
      setActionLoading(false);
    }
  };

  const openActionModal = (request: ServiceRequest, type: "approve" | "reject") => {
    setSelectedRequest(request);
    setActionType(type);
    setIsActionModalOpen(true);
  };

  const columns: Column<ServiceRequest>[] = [
 {
  key: "service",
  header: "Service",
  cell: (req) => {
    const services = req.serviceId || [];
    const MAX_VISIBLE = 2; // Kitni services directly dikhani hain
    const visibleServices = services.slice(0, MAX_VISIBLE);
    const remainingCount = services.length - MAX_VISIBLE;

    return (
      <div className="flex flex-wrap gap-1.5 items-center">
        {visibleServices.map((s, i) => (
          <span
            key={i}
            className="px-2 py-1 text-xs bg-linear-to-r from-blue-50 to-blue-100 text-blue-700 rounded-lg font-medium whitespace-nowrap"
          >
            {s.name}
          </span>
        ))}
        
        {remainingCount > 0 && (
          <div className="relative group">
            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-lg font-medium cursor-help whitespace-nowrap">
              +{remainingCount} more
            </span>
            
            <div className="absolute z-10 hidden group-hover:block bottom-full top-1 left-0 mb-2">
              <div className="bg-gray-900 text-white text-xs rounded-lg p-2 min-w-[150px] max-w-[250px] shadow-xl">
                <div className="font-semibold mb-1 border-b border-gray-700 pb-1">All Services:</div>
                <div className="space-y-1">
                  {services.map((s, i) => (
                    <div key={i} className="truncate">{s.name}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  },
},
    {
      key: "provider",
      header: "Provider",
      cell: (req) => (
        <div>
          <p className="text-sm font-semibold text-gray-900">{req.providerId?.userId?.name || "N/A"}</p>
          <p className="text-xs text-gray-500">{req.providerId?.userId?.email || "N/A"}</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (req) => {
        let badgeClass = "bg-gray-100 text-gray-700";
        if (req.status === "approved") badgeClass = "bg-emerald-100 text-emerald-700";
        if (req.status === "rejected") badgeClass = "bg-red-100 text-red-700";
        if (req.status === "pending") badgeClass = "bg-amber-100 text-amber-700";

        return (
          <span className={`capitalize px-2.5 py-1 rounded-md text-xs font-medium ${badgeClass}`}>
            {req.status}
          </span>
        );
      },
    },
    {
      key: "createdAt",
      header: "Date",
      cell: (req) => (
        <span className="text-sm text-gray-600 font-medium">
          {new Date(req.createdAt).toLocaleDateString("en-GB", {
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
      cell: (req) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push(`/dashboard/requests/${req._id}`)}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
            title="View Details"
          >
            <Icon icon="mdi:eye-outline" className="w-5 h-5" />
          </button>

          {req.status === "pending" && (
            <>
              <button
                onClick={() => openActionModal(req, "approve")}
                className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                title="Approve Request"
              >
                <Icon icon="mdi:check-circle-outline" className="w-5 h-5" />
              </button>
              <button
                onClick={() => openActionModal(req, "reject")}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                title="Reject Request"
              >
                <Icon icon="mdi:close-circle-outline" className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  const summaryCards = [
    {
      label: "Total Requests",
      value: summaryData?.totalServiceRequests || 0,
      icon: "mdi:file-document-multiple-outline",
    },
    {
      label: "Pending Requests",
      value: summaryData?.pendingRequests || 0,
      icon: "mdi:clock-outline",
    },
    {
      label: "Approved Requests",
      value: summaryData?.approvedRequests || 0,
      icon: "mdi:check-decagram",
    },
    {
      label: "Rejected Requests",
      value: summaryData?.rejectedRequests || 0,
      icon: "mdi:close-circle-outline",
    }
  ];
  const handleClearFilters = () => {
    setSearchInput("");
    setQueryState({
      page: 1,
      limit: 10,
      search: "",
      status: "",
    });
  };
  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Service Requests
            </h1>
            <p className="text-sm text-gray-500 mt-1">Manage incoming requests from providers.</p>
          </div>
        </div>

        <div>
          {!summaryData ? (
            <SummaryCardSkeleton />
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <SummaryCards data={summaryCards as any} />
            </div>
          )}
        </div>

        <div className="bg-white/80 backdrop-blur-xl border z-50 border-gray-100 shadow-sm rounded-2xl ">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 p-3">
            <div className="lg:col-span-8 w-full">
              <SearchInput
                value={searchInput}
                onChange={setSearchInput}
                placeholder="Search categories by name..."
              />
            </div>
            <div className="lg:col-span-3 w-full">

              <CustomDropdown
                icon="mdi:filter-variant"
                placeholder="All Status"
                options={[
                  { value: "", label: "All Status" },
                  { value: "pending", label: "Pending" },
                  { value: "approved", label: "Approved" },
                  { value: "rejected", label: "Rejected" },
                ]}
                value={queryState.status}
                onChange={(value:any) => setQueryState((prev) => ({ ...prev, status: value as string, page: 1 }))}
              />
            </div>

            <div className="lg:col-span-1 w-full flex items-end">
              {/* <Button
                onClick={handleClearFilters}
                icon="mdi:filter-remove-outline"
                title="Clear Filters"
                variant="secondary"
              /> */}
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl border border-gray-100 shadow-sm rounded-2xl">
          <DataTable
            columns={columns}
            data={requests}
            loading={loading}
            pagination={pagination}
            onPageChange={(page) => setQueryState((p) => ({ ...p, page }))}
            emptyTitle="No requests found"
            emptyDescription="Try adjusting your search or filters."
            emptyIcon="mdi:file-search-outline"
          />
        </div>
      </div>

      <Modal
        isOpen={isActionModalOpen}
        onClose={() => setIsActionModalOpen(false)}
        title={`${actionType.charAt(0).toUpperCase() + actionType.slice(1)} Request`}
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to {actionType} the request for <strong>{selectedRequest?.serviceId?.name||'Unknown Service'}</strong>?
          </p>

          {actionType === "reject" && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Reason
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Please provide a reason for rejecting the request"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-gray-50/50 focus:bg-white min-h-[100px]"
              />
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setIsActionModalOpen(false)}
              className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAction}
              disabled={actionLoading || (actionType === "reject" && !reason.trim())}
              className={`flex-1 px-4 py-2.5 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 ${actionType === "approve"
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "bg-red-600 hover:bg-red-700"
                }`}
            >
              {actionLoading ? (
                <Icon icon="mdi:loading" className="w-5 h-5 animate-spin" />
              ) : (
                actionType.charAt(0).toUpperCase() + actionType.slice(1)
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
