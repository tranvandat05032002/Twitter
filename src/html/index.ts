export const htmlVerify = (emailVerifyToken: string, href: string) => {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Twitter Email Verification</title>
    <style>
      @import url('https://cdn.jsdelivr.net/npm/tailwindcss@2.2.16/dist/tailwind.min.css');
    </style>
  </head>
  <body style="background-color: #f5f8fa;">
    <table className="w-full max-w-md mx-auto mt-16">
      <tr>
        <td className="bg-white p-8 rounded-lg shadow">
          <h2 className="text-2xl font-semibold mb-4">Email Verification</h2>
          <p className="text-gray-600 mb-4">Click the button below to verify your email:</p>
          <a href="${href}/verify?token=${emailVerifyToken}" className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-md block text-center text-decoration-none">
            Verify Email
          </a>
        </td>
      </tr>
    </table>
  </body>
  </html>
`
}
