
import {
    createCaption,
    updateCaption,
    deleteCaption,
    updateImage,
} from "./actions";

type Caption = {
    id: string;
    text: string;
    created_at: string;
    score: number;
};

export type MediaItem = {
    id: string;
    storage_path: string;
    description: string | null;
    created_at: string;
    captions: Caption[];
    image_url?: string;
};

type Props = {
    media: MediaItem[];
};

export default function MediaManager({ media }: Props) {
    const totalCaptions = media.reduce(
        (total, image) => total + image.captions.length,
        0
    );

    return (
        <div>
            <div className="mb-8 grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-gray-800 bg-zinc-950 p-5">
                    <p className="text-sm text-gray-400">
                        Total Images
                    </p>
                    <p className="mt-2 text-3xl font-bold">
                        {media.length}
                    </p>
                </div>

                <div className="rounded-xl border border-gray-800 bg-zinc-950 p-5">
                    <p className="text-sm text-gray-400">
                        Total Captions
                    </p>
                    <p className="mt-2 text-3xl font-bold">
                        {totalCaptions}
                    </p>
                </div>
            </div>

            {media.length === 0 && (
                <div className="rounded-xl border border-gray-800 p-8 text-center text-gray-400">
                    No images found.
                </div>
            )}

            <div className="space-y-8">
                {media.map((image, imageIndex) => (
                    <section
                        key={image.id}
                        className="overflow-hidden rounded-xl border border-gray-800 bg-zinc-950"
                    >
                        <div className="border-b border-gray-800 p-6">
                            <h2 className="mb-4 text-xl font-semibold">
                                Image #{imageIndex + 1}
                            </h2>

                            {image.image_url && (
                                <div className="mb-6 overflow-hidden rounded-lg bg-black">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={image.image_url}
                                        alt={image.description || "Uploaded image"}
                                        className="max-h-96 w-full object-contain"
                                    />
                                </div>
                            )}

                            <p className="mb-3 text-sm text-gray-500">
                                Uploaded{" "}
                                {new Date(image.created_at).toLocaleDateString()}
                            </p>

                            <form action={updateImage}>
                                <input
                                    type="hidden"
                                    name="image_id"
                                    value={image.id}
                                />

                                <label className="mb-2 block font-medium">
                                    Image Description
                                </label>

                                <textarea
                                    name="description"
                                    defaultValue={image.description ?? ""}
                                    rows={3}
                                    className="w-full rounded-lg border border-gray-700 bg-black p-3 text-white"
                                />

                                <button
                                    type="submit"
                                    className="mt-3 rounded-lg bg-purple-600 px-4 py-2 font-medium hover:bg-purple-700"
                                >
                                    Save Description
                                </button>
                            </form>
                        </div>

                        <div className="p-6">
                            <h3 className="mb-5 text-lg font-semibold">
                                Captions ({image.captions.length})
                            </h3>

                            <div className="space-y-5">
                                {image.captions.map((caption) => (
                                    <div
                                        key={caption.id}
                                        className="rounded-lg border border-gray-800 p-4"
                                    >
                                        <div className="mb-3 flex items-center justify-between">
                                            <span className="text-sm text-gray-400">
                                                Net vote score
                                            </span>

                                            <span
                                                className={
                                                    caption.score >= 0
                                                        ? "font-semibold text-green-400"
                                                        : "font-semibold text-red-400"
                                                }
                                            >
                                                {caption.score}
                                            </span>
                                        </div>

                                        <form action={updateCaption}>
                                            <input
                                                type="hidden"
                                                name="caption_id"
                                                value={caption.id}
                                            />

                                            <textarea
                                                name="text"
                                                required
                                                defaultValue={caption.text}
                                                rows={2}
                                                className="w-full rounded-lg border border-gray-700 bg-black p-3"
                                            />

                                            <button
                                                type="submit"
                                                className="mt-3 rounded-lg border border-purple-500 px-4 py-2 text-purple-400 hover:bg-purple-950"
                                            >
                                                Save Caption
                                            </button>
                                        </form>

                                        <details className="mt-4">
                                            <summary className="cursor-pointer text-sm text-red-400">
                                                Delete caption...
                                            </summary>

                                            <p className="mt-3 text-sm text-gray-400">
                                                This permanently deletes the caption
                                                and all its votes.
                                            </p>

                                            <form
                                                action={deleteCaption}
                                                className="mt-3"
                                            >
                                                <input
                                                    type="hidden"
                                                    name="caption_id"
                                                    value={caption.id}
                                                />

                                                <button
                                                    type="submit"
                                                    className="rounded-lg bg-red-700 px-4 py-2 text-white hover:bg-red-800"
                                                >
                                                    Confirm Delete
                                                </button>
                                            </form>
                                        </details>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-8 border-t border-gray-800 pt-6">
                                <h3 className="mb-4 text-lg font-semibold">
                                    Add New Caption
                                </h3>

                                <form action={createCaption}>
                                    <input
                                        type="hidden"
                                        name="image_id"
                                        value={image.id}
                                    />

                                    <textarea
                                        name="text"
                                        required
                                        placeholder="Enter a new caption..."
                                        rows={2}
                                        className="w-full rounded-lg border border-gray-700 bg-black p-3"
                                    />

                                    <button
                                        type="submit"
                                        className="mt-3 rounded-lg bg-purple-600 px-5 py-2 font-medium hover:bg-purple-700"
                                    >
                                        Add Caption
                                    </button>
                                </form>
                            </div>
                        </div>
                    </section>
                ))}
            </div>
        </div>
    );
}
