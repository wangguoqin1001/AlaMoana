$(document).ready(function(){
	$("#next").click(function(){
		if (!$("#edit").val()){
			alert("请输入内容先!!");
			return;
		}else{
			showSecondPage();
		}
	});
	$("#second").click(function(){
		showSecondPage();
	});
	$("#first").click(function(){
		showFirstPage();
	});	
});	

function showFirstPage(){
	$("#panel2").css("display", "none");
	$("h1").text("编辑");
	$("#panel1").css("display", "block");
	$("#first").addClass("pressed");
	$("#second").removeClass("pressed");
}

function showSecondPage(){
	$("#second").addClass("pressed");
	$("#first").removeClass("pressed");
	$("#panel1").css("display", "none");
	$("#panel2").css("display", "block");
	$("h1").text("显示");
	$("#show").val($("#edit").val());
}	
		
		