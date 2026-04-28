"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Icon } from "@iconify/react";
import axiosInstance from "@/config/axiosInstance";
import { getConfig } from "@/store/slicer";
import { Modal } from "@/components/ui/Modal";
import Image from "next/image";

export default function RequestDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const requestId = params.id as string;

  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject">("approve");
  const [reason, setReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchRequestDetails = useCallback(async () => {
    try {
      const response = await axiosInstance.get(`/service-requests/${requestId}`, getConfig());
      if (response.data.success) {
        setRequest(response.data.data);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to fetch request details");
      router.push("/dashboard/requests");
    } finally {
      setLoading(false);
    }
  }, [requestId, router]);

  useEffect(() => {
    if (requestId) {
      fetchRequestDetails();
    }
  }, [requestId, fetchRequestDetails]);

  const handleAction = async () => {
    setActionLoading(true);
    try {
      let url = `/service-requests/${requestId}/${actionType}`;
      let data = actionType === "reject" ? { rejectionReason: reason } : undefined;

      const response = await axiosInstance.patch(url, data, getConfig());
      if (response.data.success) {
        toast.success(`Request ${actionType}d successfully`);
        setIsActionModalOpen(false);
        setReason("");
        fetchRequestDetails();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Failed to ${actionType} request`);
    } finally {
      setActionLoading(false);
    }
  };

  const openActionModal = (type: "approve" | "reject") => {
    setActionType(type);
    setIsActionModalOpen(true);
  };

  const getTotal = (services: any[] = []) =>
  services.reduce((sum, s) => sum + (Number(s.price) || 0), 0);
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <Icon icon="mdi:loading" className="w-10 h-10 text-primary-600 animate-spin" />
      </div>
    );
  }

  if (!request) return null;
const services = Array.isArray(request?.serviceId)
  ? request.serviceId
  : request?.serviceId
    ? [request.serviceId]
    : [];
  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/dashboard/requests")}
            className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <Icon icon="mdi:arrow-left" className="w-6 h-6 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold bg-linear-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Service Request Details
            </h1>
            <p className="text-sm text-gray-500 mt-1">Review service offering proposal from provider.</p>
          </div>
        </div>

        {/* Content */}
<div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
  <div className="flex justify-between items-start mb-6">
    <div className="flex items-center gap-4">

      {/* ICON SECTION */}
      <div className="w-16 h-16 bg-primary-50 rounded-xl flex items-center justify-center text-primary-600">
        {services.length > 1 ? (
          <Icon icon="mdi:tools" className="w-8 h-8" />
        ) : (
          services[0]?.icon ? (
            <img
              src={services[0].icon}
              alt="icon"
              className="w-10 h-10 object-contain"
            />
          ) : (
            <Icon icon="mdi:tools" className="w-8 h-8" />
          )
        )}
      </div>

      {/* TITLE */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">
          {services.length > 1 ? "Multiple Services Request" : services[0]?.name}
        </h2>
        <p className="text-sm text-gray-500">
          {request.categoryId?.name}
        </p>
      </div>
    </div>

    {/* STATUS */}
    <div className="flex flex-col items-end gap-2">
      <span
        className={`capitalize px-4 py-1.5 rounded-full text-sm font-semibold ${
          request.status === "approved"
            ? "bg-emerald-100 text-emerald-700"
            : request.status === "rejected"
            ? "bg-red-100 text-red-700"
            : "bg-amber-100 text-amber-700"
        }`}
      >
        {request.status}
      </span>

     
      <span className="text-xl font-bold text-gray-900">
  ৳{getTotal(services)}
</span>
    </div>
  </div>

  {/* DESCRIPTION (FIRST SERVICE OR MULTI INFO) */}
  {services.length === 1 && services[0]?.description && (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-2">
        Service Description
      </h3>
      <p className="text-gray-600 text-sm leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100">
        {services[0].description}
      </p>
    </div>
  )}

  {/* MULTIPLE SERVICES LIST */}
  {services.length > 1 && (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">
        Requested Services ({services.length})
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {services.map((service:any) => (
          <div
            key={service._id}
            className="p-4 bg-gray-50 border border-gray-100 rounded-xl"
          >
            <div className="flex items-start gap-3">
              {service.icon ? (
                <Image
                  src={`${process.env.NEXT_PUBLIC_API_URL}${service.icon}`}
                  width={200}
                  height={200} 
                  unoptimized
                  alt=""
                  className="w-10 h-10 object-contain"
                />
              ) : (
                <Icon icon="mdi:tools" className="w-10 h-10 text-gray-400" />
              )}

              <div className="flex-1">
                <div className="flex justify-between">
                  <h4 className="font-semibold text-gray-900 text-sm">
                    {service.name}
                  </h4>
                  <span className="text-sm font-bold text-gray-900">
                    ${service.price}
                  </span>
                </div>

                {service.description && (
                  <p className="text-xs text-gray-500 mt-2">
                    {service.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )}

  {/* PROVIDER + DETAILS (UNCHANGED) */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 border-t border-gray-100 pt-6">
    <div>
      <h3 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">
        Provider Information
      </h3>

      <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
     <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold overflow-hidden">
  {request.providerId?.userId?.profilePicture ? (
    <Image
      src={`${process.env.NEXT_PUBLIC_API_URL}${request.providerId.userId.profilePicture}`}
      width={40}
      height={40}
      alt="profile"
      className="w-full h-full object-cover"
      unoptimized
    />
  ) : (
    request.providerId?.userId?.name?.charAt(0) || "P"
  )}
</div>
        <div>
          <p className="font-semibold text-gray-900">
            {request.providerId?.userId?.name}
          </p>
          <p className="text-sm text-gray-500">
            {request.providerId?.userId?.email}
          </p>
        </div>

        <button
          onClick={() =>
            router.push(`/dashboard/providers/${request.providerId?._id}`)
          }
          className="ml-auto p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
        >
          <Icon icon="mdi:open-in-new" className="w-5 h-5" />
        </button>
      </div>
    </div>

    <div>
      <h3 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">
        Submission Details
      </h3>

      <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
        <div className="flex justify-between">
          <span className="text-gray-500 text-sm">Submitted On</span>
          <span className="text-gray-900 font-medium text-sm">
            {new Date(request.createdAt).toLocaleString()}
          </span>
        </div>

        {request.reviewedByAdmin && (
          <div className="flex justify-between">
            <span className="text-gray-500 text-sm">Reviewed By</span>
            <span className="text-gray-900 font-medium text-sm">
              {request.reviewedByAdmin.name}
            </span>
          </div>
        )}

        {request.rejectionReason && (
          <div className="mt-2 pt-2 border-t border-gray-200">
            <span className="text-red-500 text-sm font-semibold block mb-1">
              Rejection Reason:
            </span>
            <span className="text-gray-700 text-sm">
              {request.rejectionReason}
            </span>
          </div>
        )}
      </div>
    </div>
  </div>

  {/* ACTION BUTTONS */}
  {request.status === "pending" && (
    <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
      <button
        onClick={() => openActionModal("reject")}
        className="px-6 py-2.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-semibold transition-colors flex items-center gap-2"
      >
        <Icon icon="mdi:close-circle-outline" className="w-5 h-5" />
        Reject Request
      </button>

      <button
        onClick={() => openActionModal("approve")}
        className="px-6 py-2.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl font-semibold transition-colors flex items-center gap-2"
      >
        <Icon icon="mdi:check-circle-outline" className="w-5 h-5" />
        Approve Request
      </button>
    </div>
  )}
</div>
      </div>

      {/* Action Modal */}
      <Modal
        isOpen={isActionModalOpen}
        onClose={() => setIsActionModalOpen(false)}
        title={`${actionType.charAt(0).toUpperCase() + actionType.slice(1)} Request`}
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to {actionType} the request for <strong>{request?.serviceId?.name}</strong>?
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
