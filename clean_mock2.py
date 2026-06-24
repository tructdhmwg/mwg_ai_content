import sys

def main():
    source_path = "src/pages/pim/ProductDetailPage.tsx"
    dest_path = "src/pages/pim/SpecsDemoPage.tsx"
    
    with open(source_path, "r") as f:
        lines = f.readlines()

    out_lines = []
    skip = False
    
    for i, line in enumerate(lines):
        # Rename component
        if "export function ProductDetailPage()" in line:
            out_lines.append(line.replace("ProductDetailPage", "SpecsDemoPage"))
            continue
            
        # Start skipping at Section 1
        if "{/* Section 1: Tên sản phẩm */}" in line:
            skip = True
            
        # Stop skipping at Section 6
        if "{/* Section 6: Thông số kỹ thuật */}" in line:
            skip = False
        
        # Start skipping at Section 7
        if "{/* Section 7: Đặc điểm nổi bật (Highlights) */}" in line:
            skip = True
            
        # Stop skipping at the Right Column
        if "{/* Right Column: AI Config, Specs Reference Files, & Job History (4/12 width) */}" in line:
            skip = False
            
        if not skip:
            out_lines.append(line)

    with open(dest_path, "w") as f:
        f.writelines(out_lines)

if __name__ == "__main__":
    main()
