"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Icon } from "@iconify/react";
import toast from "react-hot-toast";
import axiosInstance from "@/config/axiosInstance";
import { getConfig } from "@/store/slicer";
import Button from "@/components/ui/Button";

export default function EditVideoPage() {
    const router = useRouter();
    const { id } = useParams();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        scheduledDate: "",
        hasListenOnlyMode: true,
    });

    // Current files ka URL store karne ke liye
    const [existingFiles, setExistingFiles] = useState({ videoUrl: "", thumbnail: "" });
    const [files, setFiles] = useState<{ video: File | null; thumbnail: File | null }>({
        video: null,
        thumbnail: null,
    });

    useEffect(() => {
        const fetchVideoData = async () => {
            try {
                const res = await axiosInstance.get(`/daily-content/video/${id}`, getConfig());
                const data = res.data.data;
                setFormData({
                    title: data.videoContent.title,
                    description: data.videoContent.description,
                    scheduledDate: data.date.split("T")[0],
                    hasListenOnlyMode: data.videoContent.hasListenOnlyMode,
                });
                // Current files set karein
                setExistingFiles({
                    videoUrl: data.videoContent.videoUrl,
                    thumbnail: data.videoContent.thumbnail
                });
            } catch (error) {
                toast.error("Failed to load video data");
                router.back();
            } finally {
                setFetching(false);
            }
        };
        fetchVideoData();
    }, [id, router]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        if (type === "checkbox") {
            setFormData((prev) => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, files: fileList } = e.target;
        if (fileList && fileList[0]) {
            setFiles((prev) => ({ ...prev, [name]: fileList[0] }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const data = new FormData();
        data.append("title", formData.title);
        data.append("description", formData.description);
        data.append("date", formData.scheduledDate);
        data.append("hasListenOnlyMode", String(formData.hasListenOnlyMode));
        
        if (files.video) data.append("video", files.video);
        if (files.thumbnail) data.append("image", files.thumbnail);

        try {
            await axiosInstance.put(`/daily-content/video/${id}`, data, {
                ...getConfig(),
                headers: { "Content-Type": "multipart/form-data" },
            });
            toast.success("Video updated successfully!");
            router.push("/dashboard/video");
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to update");
        } finally {
            setLoading(false);
        }
    };

    if (fetching) return <div className="p-8 text-center">Loading content...</div>;

    return (
        <div className="min-h-screen bg-[#F8FAFC] p-6 lg:p-8">
            <div className="max-w-3xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <h1 className="text-2xl font-bold">Edit Video Content</h1>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-5">
                        
                        {/* CURRENT FILES SECTION */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-4 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Current Video</label>
                                <video src={existingFiles.videoUrl} className="w-full h-32 object-cover rounded-lg" controls />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Current Thumbnail</label>
                                <img src={existingFiles.thumbnail} alt="thumbnail" className="w-full h-32 object-cover rounded-lg" />
                            </div>
                        </div>

                        {/* INPUTS FOR UPDATES */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-semibold mb-1">Update Video</label>
                                <input type="file" name="video" accept="video/*" onChange={handleFileChange} className="w-full p-2 border rounded-xl" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-1">Update Thumbnail</label>
                                <input type="file" name="thumbnail" accept="image/*" onChange={handleFileChange} className="w-full p-2 border rounded-xl" />
                            </div>
                        </div>
                        
                        {/* Other Form Fields... */}
                        <input required type="text" name="title" value={formData.title} onChange={handleChange} className="w-full h-11 px-4 rounded-xl border" placeholder="Title" />
                        <textarea required name="description" rows={3} value={formData.description} onChange={handleChange} className="w-full p-4 rounded-xl border" placeholder="Description" />
                    </div>

                    <div className="flex justify-end gap-3">
                        <Button variant="secondary" type="button" onClick={() => router.back()}>Cancel</Button>
                        <Button type="submit" loading={loading}>Save Changes</Button>
                    </div>
                </form>
            </div>
        </div>
    );
}