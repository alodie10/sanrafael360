set -e
cd public_html || cd domains/sanrafael360.com/public_html || exit 1
mkdir -p wp-content/uploads/2025/05/ wp-content/uploads/2024/10/
base64 -d > wp-content/uploads/2025/05/sanrafael360logo1.png
cp wp-content/uploads/2025/05/sanrafael360logo1.png wp-content/uploads/2024/10/logo-1.png
echo "LOGO COPIED SUCCESFULLY"
