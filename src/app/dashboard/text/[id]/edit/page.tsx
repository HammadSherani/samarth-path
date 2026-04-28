"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Icon } from "@iconify/react";
import toast from "react-hot-toast";
import axiosInstance from "@/config/axiosInstance";
import { getConfig } from "@/store/slicer";
import Button from "@/components/ui/Button";

export default function EditTextPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id; // Taking ID from URL params

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    label: "",
    image: "",
    scheduledDate: "",
    unlocksAt: "",
    isActive: true,
  });

  // ─── Fetch Existing Data ──────────────────────────────────────────────────
  const fetchContentDetails = useCallback(async () => {
    try {
      const response = await axiosInstance.get(`/daily-content/text/${id}`, getConfig());
      if (response.data.success) {
        const data = response.data.data;
        setFormData({
          title: data.textContent?.title || "",
          description: data.textContent?.description || "",
          label: data.textContent?.label || "",
          image: data.textContent?.image || "",
          // Formatting date to YYYY-MM-DD for the input field
          scheduledDate: data.date ? new Date(data.date).toISOString().split("T")[0] : "",
          unlocksAt: data.unlocksAt || "08:00",
          isActive: data.isActive,
        });
      }
    } catch (error: any) {
      toast.error("Failed to load content details");
      router.push("/dashboard/content/text");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    if (id) fetchContentDetails();
  }, [id, fetchContentDetails]);

  // ─── Event Handlers ───────────────────────────────────────────────────────
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);

    try {
      const response = await axiosInstance.put(
        `/daily-content/text/${id}`,
        formData,
        getConfig()
      );

      if (response.data.success) {
        toast.success("Content updated successfully!");
        router.push("/dashboard/content/text");
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || "Failed to update content";
      toast.error(errorMsg);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 lg:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all shadow-sm"
          >
            <Icon icon="mdi:arrow-left" className="w-6 h-6 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Text Content</h1>
            <p className="text-sm text-gray-500">Modify the details of your scheduled update.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-5">
            
            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Title</label>
              <input
                required
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter title"
                className="w-full h-11 px-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
              />
            </div>

            {/* Label & Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Label</label>
                <input
                  required
                  type="text"
                  name="label"
                  value={formData.label}
                  onChange={handleChange}
                  placeholder="e.g., Latest, Urgent"
                  className="w-full h-11 px-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Status</label>
                <select
                  name="isActive"
                  value={String(formData.isActive)}
                  onChange={(e) => setFormData(p => ({...p, isActive: e.target.value === "true"}))}
                  className="w-full h-11 px-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none bg-white"
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            </div>

            {/* Publish Date & Unlock Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Publish Date</label>
                <input
                  required
                  type="date"
                  name="scheduledDate"
                  min={new Date().toISOString().split("T")[0]}
                  value={formData.scheduledDate}
                  onChange={handleChange}
                  className="w-full h-11 px-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Unlock Time (24h Format)</label>
                <input
                  required
                  type="time"
                  name="unlocksAt"
                  value={formData.unlocksAt}
                  onChange={handleChange}
                  className="w-full h-11 px-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>
            </div>

            {/* Image URL */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Image URL</label>
              <input
                required
                type="url"
                name="image"
                value={formData.image}
                onChange={handleChange}
                placeholder="https://example.com/image.jpg"
                className="w-full h-11 px-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
              <textarea
                required
                name="description"
                rows={5}
                value={formData.description}
                onChange={handleChange}
                placeholder="Update details..."
                className="w-full p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none transition-all resize-none"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3">
            <Button
              variant="secondary"
              type="button"
              onClick={() => router.back()}
              disabled={updating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={updating}
              icon="mdi:content-save-edit"
            >
              Update Content
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}