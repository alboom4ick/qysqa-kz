
### 1. **BaseNode Class**

The `BaseNode` class serves as the base class for all UI components and contains several attributes that define the visual style, behavior, and layout of the node. It includes properties like `id`, `nodeType`, layout attributes (`padding`, `margin`, `height`, `width`), and other visual settings like `background`, `borderType`, `fontColor`, and `opacity`.

**Key Methods and Features:**

* `addLink(String to)`: Adds a link from the current node to another node.
* **Nested `Link` Class**: Represents a link between two nodes, identified by their IDs.
* The class is extended by other specialized components such as `Text`, `Stack`, `IconText`, etc.

### 2. **TitledContainer Class**

* Extends `BaseNode` and represents a container with a title.
* It includes a `titleText` (a `Text` object) and an optional `content` (another `BaseNode`).

### 3. **Text Class**

* Extends `BaseNode` and represents a text element.
* It contains properties for text formatting such as `fontSize`, `HTMLText`, `textAlign`, `fontColor`, and `fontWeight`.

### 4. **Stack Class**

* Extends `BaseNode` and represents a stack (a layout that can be vertical or horizontal).
* It includes properties such as `gap`, `flexWrap`, `justifyContent`, and `alignItems`, which control the layout and positioning of child nodes within the stack.

### 5. **IconText Class**

* Extends `BaseNode` and represents a node containing both text and an icon.
* The icon is represented using the `Icon` enum, and the text is a `Text` object.

### 6. **CenteredContainer Class**

* Extends `BaseNode` and represents a container with a single centered child node.

### 7. **NodeType Enum**

Defines different types of nodes that can be created from `BaseNode`:

* `TEXT`, `ICON_TEXT`, `TITLED_CONTAINER`, `CENTERED_CONTAINER`, and `STACK`.

### 8. **AlignItems Enum**

Defines possible alignments for items in a container:

* `START`, `CENTER`, `END`, and `STRETCH`.

### 9. **Background Enum**

Defines possible background styles for nodes:

* `PRIMARY`, `DEFAULT`, `SECONDARY`, and `TERTIARY`.

### 10. **BorderType Enum**

Defines possible border styles for nodes:

* `SOLID`, `DASHED`, `DOTTED`, and `NONE`.

### 11. **FlexWrap Enum**

Defines whether items in a container should wrap:

* `WRAP` and `NOWRAP`.

### 12. **FontColor Enum**

Defines font color options for nodes:

* `PRIMARY`, `DEFAULT`, `SECONDARY`, and `TERTIARY`.

### 13. **FontSize Enum**

Defines font size options for text:

* `BIG`, `MEDIUM`, and `SMALL`.

### 14. **FontWeight Enum**

Defines font weight options for text:

* `BOLD`, `REGULAR`, and `THIN`.

### 15. **Icon Enum**

Defines a list of available icons that can be used in `IconText` nodes. Each icon is represented by a unique string value, such as "🚶" for a pedestrian, "🔥" for fire, "📚" for books, and so on.

### 16. **JustifyContent Enum**

Defines how child elements are aligned within a container:

* `SPACE_BETWEEN`, `SPACE_AROUND`, `CENTER`, and `STRETCH`.

### 17. **TextAlign Enum**

Defines text alignment options:

* `LEFT`, `CENTER`, and `RIGHT`.

### JSON Serialization Annotations

* The `@JsonTypeInfo` and `@JsonSubTypes` annotations are used to handle serialization and deserialization of polymorphic objects, allowing for different types of `BaseNode` (such as `Stack`, `Text`, `IconText`, etc.) to be recognized and properly mapped when working with JSON.

### Summary:

The code creates a flexible and extensible UI framework where components can be combined into hierarchical structures. The layout is highly customizable, with various configuration options for alignment, size, and styling. The use of enums for properties like font size, color, and alignment ensures that UI components are consistently styled and easy to manage. This structure is suitable for dynamically generating complex UI elements with varying types of content, such as text, images, and icons, while providing detailed control over their presentation.
