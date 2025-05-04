// @ts-ignore
import React, { ReactNode, forwardRef } from 'react';
import { Stack } from "../types";
import { getAlignItemsValue, getEnumValue, getStylesFromBaseNode } from "../lib";

interface Props {
    obj: Stack;
    children: ReactNode;
}

const StackNode = forwardRef<HTMLDivElement, Props>(({ obj, children }, ref) => {
    const style: React.CSSProperties = {
        display: 'flex',
        flexDirection: obj.vertical ? 'column' : 'row',
        ...(getStylesFromBaseNode(obj)),
        ...(obj.flexWrap && { flexWrap: obj.flexWrap }),
        ...(obj.justifyContent && { justifyContent: getEnumValue(obj.justifyContent) }),
        ...(obj.alignItems && { alignItems: getAlignItemsValue(obj.alignItems) }),
        ...(obj.gap && { gap: `${obj.gap}px` }),
    };

    return (
        <div ref={ref} style={style}>
            {children}
        </div>
    );
});

StackNode.displayName = "StackNode";

export default StackNode;
