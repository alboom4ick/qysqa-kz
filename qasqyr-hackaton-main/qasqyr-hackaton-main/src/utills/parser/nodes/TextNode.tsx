// @ts-ignore
import React, { forwardRef } from 'react';
import { Text } from '../types';
import { getColor, getFontSize, getFontWeight, getStylesFromBaseNode } from "../lib";

interface Props {
    obj: Text;
}

export const TextNode = forwardRef<HTMLParagraphElement, Props>(({ obj }, ref) => {
    const style: React.CSSProperties = {
        ...(obj.fontColor && { color: getColor(obj.fontColor) }),
        fontWeight: getFontWeight(obj.fontWeight),
        ...(obj.fontSize && { fontSize: getFontSize(obj.fontSize) }),
        ...(obj.textAlign && { textAlign: obj.textAlign }),
        ...(getStylesFromBaseNode(obj)),
    };

    return <p ref={ref} style={style} dangerouslySetInnerHTML={{ __html: obj.htmltext }}></p>;
});

TextNode.displayName = "TextNode";

export default TextNode;
