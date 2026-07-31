import Image from "next/image";

import {
  projectTypeImageDimensions,
  projectTypeImages,
} from "@/lib/project-cover";
import type { ContentTypeId } from "@/lib/content-types";

export function ProjectCover({
  image,
  isTypeImage,
  template,
  sizes,
}: {
  image: string;
  isTypeImage: boolean;
  template: ContentTypeId;
  sizes: string;
}) {
  return (
    <div className="relative flex aspect-[2.2/1] items-center justify-center overflow-hidden bg-[#eeeaff]">
      {image.startsWith("blob:") ? (
        <>
          {/* Local OPFS previews use blob URLs; Next Image cannot render them reliably. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image}
            alt=""
            className={
              isTypeImage
                ? "h-full w-full object-contain object-center"
                : "h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-[1.03]"
            }
          />
        </>
      ) : isTypeImage ? (
        <Image
          src={image}
          alt=""
          width={projectTypeImageDimensions[template].width}
          height={projectTypeImageDimensions[template].height}
          sizes={sizes}
          className="h-auto w-auto max-h-[78%] max-w-[78%] object-contain object-center"
        />
      ) : (
        <Image
          src={image}
          alt=""
          fill
          sizes={sizes}
          className="object-cover object-center transition-transform duration-300 group-hover:scale-[1.03]"
        />
      )}
    </div>
  );
}

export function ProjectTypeCover({
  coverImage,
  template,
  sizes,
}: {
  coverImage?: string;
  template: ContentTypeId;
  sizes: string;
}) {
  return (
    <ProjectCover
      image={coverImage ?? projectTypeImages[template]}
      isTypeImage={!coverImage}
      template={template}
      sizes={sizes}
    />
  );
}
