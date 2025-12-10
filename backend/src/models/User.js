import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
	{
		fullName: {
			type: String,
			required: true,
			trim: true,
			minlength: 2,
		},

		email: {
			type: String,
			required: true,
			unique: true,
			trim: true,
			match: [/^\S+@\S+\.\S+$/, "Invalid email"],
		},

		password: {
			type: String,
			required: true,
			minlength: 8, // cohérent avec la regex password policy
		},

		bio: { type: String, default: "" },
		nativeLanguage: { type: String, default: "" },
		learningGoal: { type: String, default: "" },

		avatar: { type: String, default: "" }, // possible Gravatar/nominification

		friends: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "User",
			},
		],
	},
	{ timestamps: true }
);

/* ---------------------------------------------------------
 *  Password Hashing
 * --------------------------------------------------------- */

userSchema.pre("save", async function (next) {
	if (!this.isModified("password")) return next();

	const salt = await bcrypt.genSalt(10);
	this.password = await bcrypt.hash(this.password, salt);
	next();
});

/* ---------------------------------------------------------
 *  Password Comparison
 * --------------------------------------------------------- */

userSchema.methods.matchPassword = async function (enteredPassword) {
	return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;
