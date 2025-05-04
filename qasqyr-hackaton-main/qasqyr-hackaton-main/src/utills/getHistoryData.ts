
export function getMapImageUrl(filename: string) {
    return `${process.env.NEXT_PUBLIC_API_URL}/files/maps/retrieve/files/${filename}`;
}

export function getImageUrl(filename: string) {
    const dirAndName = filename.split("/")

    if (dirAndName.length <= 1) return "empty"

    return `${process.env.NEXT_PUBLIC_API_URL}/files/${dirAndName[0]}/retrieve/files/${dirAndName[1]}`;
}