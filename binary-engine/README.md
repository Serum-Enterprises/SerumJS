# Binary-Engine
A Binary Storage Engine working with JSON-like Data

## Features

### v0.1.0-beta.0
- IPC Communication
- Store a single "Block" of JSON Data in a Transaction
- Retrieve a single Transaction
- Retrieve a stream of Transactions in a Range
- Append a single Transaction to a Ledger

## Binary JSON Data Encoding (BJDE)

The Binary JSON Data Encoding (BJDE) is a compact Binary Format for storing JSON-like Data Structures. It is designed to be efficient in Terms of both Space and Speed, making it suitable for high-performance applications.

## Definitions:
* **Bit**: a single Bit, either `0b0` or `0b1`
* **Byte**: 8 Bits
* **Word**: 8 Bytes (64 Bits)
* **Structure Section**: the first part of a BJDE Document, containing Structural Words
* **BLOB Section**: the second part of a BJDE Document, containing Byte-Aligned Data

### Binary Document Layout

A BJDE Document consist of two Sections: the **Structure Section** and the **BLOB Section**. The Structure Section contains Structural Data such as Nulls, Booleans, Small Integers (up to 56 Bit), Inline Strings (up to 6 Bytes), Array Structures and Object Structures; while the Blob Section contains variable-length data such as Large Integers, Floats, Strings as well as User-defined BLOBs.

Other than the BLOB Section, which is Byte-Aligned, the Structure Section is Word-Aligned, meaning that all data in the Structure Section is aligned to 8 Bytes (64 Bits). This allows for efficient access and manipulation of the data. An extension of the Format to support larger Words is planned.

General Document Layout:
```
[8 Bytes: Document MetaData]
[8 Bytes: Structure Section Length in Words]
[8 Bytes: BLOB Section Length in Bytes]
[(Structure Length * 8) Bytes: Structure Section]
[(Blob Length) Bytes: BLOB Section]
```

### Structure Section

* **Word Aligned**
* Contains **only Structural Words**.

### Blob Section

* **Byte Aligned**
* Contains Variable-Length Data (Large Integers, Floats, Long Strings, User-Defined BLOBs)
* Starts directly after the Structure Section

#### Structural Words (64 Bits)

```
[1 Bit Version][2 Bits Reserved][3 Bits Type][1 Bit Flag][56 Bits Data or Pointer]
```

#### Structural Word Types

| Type Bits | Meaning           | Description                                                                                                                                                                                         |
| --------- | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `0b000`   | Null              | Entire Word is `0x0000000000000000`, basically the Value `null` in JSON                                                                                                                                                                 |
| `0b001`   | Boolean           | Must always be `Flag = 0`, Inline Boolean (`0` = `false`, `>0` = `true`)                                                                                                                              |
| `0b010`   | Integer           | `Flag = 0`: 56-bit signed Integer <br> `Flag = 1`: Pointer to Blob Section                                                                                                                          |
| `0b011`   | Float             | Must always be `Flag = 1`. Pointer to Blob Section containing IEEE 754 floating-point representation. The first byte is the size of the float in bytes (e.g., 4, 8, 16), followed by the float data |
| `0b100`   | String            | `Flag = 0`: Inline String (1 byte length `0-6`, 6 bytes data) <br> `Flag = 1`: Pointer to Blob Section                                                                                              |
| `0b101`   | Array             | Must always be `Flag = 1`. Pointer to Structure Section (first Word: Item Count, followed by `Item Count` Structural Words). Pointer `0` indicates empty Array                                                                       |
| `0b110`   | Object            | Must always be `Flag = 1`. Pointer to Structure Section (first Word: Item Count, followed by `Item Count * 2` Structural Words (Key/Value Pairs)). Pointer `0` indicates empty Object                                               |
| `0b111`   | User-Defined BLOB | `Flag = 0`: Inline BLOB (1 byte length `0-6`, 6 bytes data) <br> `Flag = 1`: Pointer to BLOB Section                                                                                                |

#### Inline Blob (`Flag = 0`)

```
[1 Byte Length (0-6)][Up to 6 Bytes Blob data (padded with 0)]
```

#### Inline String (`Flag = 0`)

```
[1 Byte Length (0-6)][Up to 6 Bytes String data (padded with 0)]
```

---

### Pointer Destination Clarification

| Type              | Pointer Target    |
| ----------------- | ----------------- |
| User-defined Blob | Blob Section      |
| Integer           | Blob Section      |
| Float             | Blob Section      |
| String            | Blob Section      |
| Array             | Structure Section |
| Object            | Structure Section |

#### Important:

All pointers (when `Flag = 1`) are **absolute byte offsets from the start of the Document**, regardless of target section.

#### Empty Structures

* Arrays, Objects ➔ Pointer `0` ➔ empty.

---

### Summary of Best Practices

* Structure Section uses **Word Length in header** for easy calculation.
* Blob Section remains **Byte Aligned**, flexible, compact.
* All pointers are **absolute byte offsets**, simplifying parsing and memory mapping.
* Inline formats for small Blobs and Strings reduce jumps and overhead.
* Usage of `User-defined Blob` is **user-specific**, intended for storing arbitrary data or cross-transaction pointers as per higher-level logic.
* **Floats are always stored in the Blob Section as IEEE 754 floating-point representation. The first byte defines the size of the float in bytes (e.g., 4, 8, 16), followed by the float data itself. This allows for flexibility while ensuring compatibility with standard floating-point operations.**
